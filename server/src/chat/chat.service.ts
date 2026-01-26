/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { createAzure } from '@ai-sdk/azure';
import { streamText, tool } from 'ai';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { Response } from 'express';
import { z } from 'zod';

import { CreateChatDto, MessageDto } from './dto/create-chat.dto';

import { UserRole } from 'src/user/entities/user.entity';



interface UserContext {
  userId: string;
  role: UserRole;

  doctorId?: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly azure: ReturnType<typeof createAzure>;
  private readonly model: string = 'o4-mini';

  // Rate limiting constants
  private readonly RATE_LIMIT_COUNT = 10;
  private readonly RATE_LIMIT_TTL = 86400;

  // Timeout constants
  private readonly RESPONSE_TIMEOUT = 30000;
  private readonly STREAM_TIMEOUT = 45000;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.getOrThrow<string>(
      'AZURE_OPENAI_API_KEY',
    );
    // const resourceName = this.configService.getOrThrow<string>(
    //   'AZURE_OPENAI_RESOURCE_NAME',
    // );
    // const apiVersion = this.configService.get<string>(
    //   'AZURE_OPENAI_API_VERSION',
    //   '2025-01-01-preview',
    // );

    this.azure = createAzure({
      apiKey,
      // resourceName,
      // apiVersion,
      baseURL:
        'https://azuretalk.openai.azure.com/openai/deployments/o4-mini/chat/completions?api-version=2025-01-01-preview',
    });
  }

  async testModel() {
    try {
      this.logger.debug('Testing Azure OpenAI connection...');

      const testPayload = {
        model: this.azure(this.model),
        temperature: 0.9,
        maxTokens: 15,
        messages: [
          {
            role: 'system' as const,
            content:
              'You are a test validator. Respond ONLY with "TEST_SUCCESS"',
          },
          {
            role: 'user' as const,
            content: 'What is the test validation code?',
          },
        ],
      };

      // 2. ENABLE timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let response = '';
      let chunkCount = 0;

      this.logger.debug('Sending request to Azure...');
      const startTime = Date.now();

      try {
        // 3. Add error listener to the stream
        const result = streamText({
          ...testPayload,
          abortSignal: controller.signal,
        });

        // 4. Handle stream errors explicitly
        // result.textStream.on('error', (err) => {
        //   this.logger.error('Stream error:', err);
        //   controller.abort();
        // });

        for await (const delta of result.textStream) {
          response += delta;
          chunkCount++;
          this.logger.verbose(`Received chunk ${chunkCount}: ${delta}`);
        }
      } finally {
        clearTimeout(timeoutId);
      }

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Response: '${response}' | Chunks: ${chunkCount} | Time: ${duration}ms`,
      );

      // 3. Case-insensitive validation
      if (!response.trim().toUpperCase().includes('TEST_SUCCESS')) {
        throw new Error(`Invalid response: '${response}'`);
      }

      return { response, chunkCount, success: true };
    } catch (error) {
      // 4. Specific Azure error handling
      if (error.name === 'AbortError') {
        this.logger.error('Azure request timed out');
      } else if (error.response?.data?.error) {
        this.logger.error('Azure API Error:', error.response.data.error);
      } else {
        this.logger.error('Test Failed', {
          message: error.message,
          stack: error.stack,
        });
      }

      throw new Error(`Azure test failed: ${error.message}`);
    }
  }

  async handleRequest({
    ip,
    createChatDto,
    res,
    userId,
    userRole,
  }: {
    ip: string;
    createChatDto: CreateChatDto;
    res: Response;
    userId: string;
    userRole: UserRole;
  }): Promise<void> {
    const requestTimeout = setTimeout(() => {
      if (!res.headersSent) {
        this.logger.error('Request timeout - sending 408');
        res.status(408).json({
          error: 'Request timeout',
          message: 'The request took too long to process. Please try again.',
        });
      }
    }, this.RESPONSE_TIMEOUT);

    try {
      this.logger.log(
        `Handling request for user: ${userId}, role: ${userRole}, IP: ${ip}`,
      );

      // Check if IP is blocked
      const isBlocked = await this.cacheManager.get(`blocked:${ip}`);
      if (isBlocked) {
        this.logger.warn(`Blocked IP attempted request: ${ip}`);
        this.sendRateLimitResponse(res);
        return;
      }

      // Rate limiting logic
      const countKey = `count:${ip}`;
      const count = (await this.cacheManager.get<number>(countKey)) ?? 0;

      if (count >= this.RATE_LIMIT_COUNT) {
        this.logger.warn(`Rate limit exceeded for IP: ${ip}`);
        await this.cacheManager.set(`blocked:${ip}`, true, this.RATE_LIMIT_TTL);
        this.sendRateLimitResponse(res);
        return;
      }

      await this.cacheManager.set(countKey, count + 1, this.RATE_LIMIT_TTL);
      this.logger.log(`Rate limit updated for IP: ${ip}, count: ${count + 1}`);

      const { messages } = createChatDto;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        throw new Error('Invalid or empty messages array');
      }

      this.logger.log(`Processing ${messages.length} messages`);

      // Get user context with explicit role
      const userContext = await this.getUserContext(userId, userRole);
      this.logger.log(
        `User context determined: ${JSON.stringify(userContext)}`,
      );

      // Set headers for streaming
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Transfer-Encoding', 'chunked');

      await this.generateMedicalResponse(messages, userContext, res);

      clearTimeout(requestTimeout);
      this.logger.log('Request completed successfully');
    } catch (error) {
      clearTimeout(requestTimeout);
      this.logger.error('Generation error:', error);
      this.handleResponseError(res, error);
    }
  }
  // 3. Update getUserContext to accept role parameter
  private async getUserContext(
    userId: string,
    role: UserRole,
  ): Promise<UserContext> {
    const context: UserContext = { userId, role };

    try {
      this.logger.log(`Setting user context for: ${userId}, role: ${role}`);

      // Based on role, get the specific ID
      switch (role) {
        case UserRole.ADMIN: {
          this.logger.log('Admin role set - no additional ID needed');
          break;
        }

        default: {
          this.logger.warn(
            `Unknown role: ${role as string}, defaulting to user`,
          );
          context.role = UserRole.USER;
          break;
        }
      }

      return context;
    } catch (error) {
      this.logger.error('Error setting user context:', error);
      throw error; // Re-throw instead of defaulting
    }
  }

  private sendRateLimitResponse(res: Response): void {
    if (!res.headersSent) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message:
          'You have reached the message limit for today. Please try again later.',
      });
    }
  }

  private handleResponseError(res: Response, error: unknown): void {
    const errorMessage =
      error instanceof Error ? error.message : 'Response generation failed';

    this.logger.error('Handling response error:', errorMessage);

    if (!res.headersSent) {
      res.status(500).json({ error: errorMessage });
    }
  }

  private async generateMedicalResponse(
    messages: MessageDto[],
    userContext: UserContext,
    res: Response,
  ): Promise<void> {
    this.logger.log('Starting medical response generation');

    const streamTimeout = setTimeout(() => {
      this.logger.error('Stream timeout occurred');
      if (!res.destroyed && !res.writableEnded) {
        res.write('\n\nResponse timeout. Please try again.');
        res.end();
      }
    }, this.STREAM_TIMEOUT);

    try {
      const tools = this.getTools();
      const systemMessage = this.getSystemMessage(userContext);

      this.logger.log(`System message length: ${systemMessage.content.length}`);
      this.logger.log(
        `Number of tools available: ${Object.keys(tools).length}`,
      );

      const aiMessages = [
        systemMessage,
        ...messages.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      ];

      this.logger.log(
        'Calling Azure OpenAI API with messages:',
        aiMessages.length,
      );

      // Add debugging for the actual request
      this.logger.log(
        'AI Messages structure:',
        JSON.stringify(aiMessages, null, 2),
      );

      const result = streamText({
        model: this.azure(this.model),
        messages: aiMessages,
        tools,
        maxTokens: 1024,
        temperature: 0.7,
      });

      this.logger.log('Stream result created successfully');

      let hasStarted = false;
      let chunkCount = 0;
      let totalContent = '';

      try {
        // Handle the response promise separately for debugging
        result.response
          .then((response) => {
            this.logger.log(
              `AI Response received - Messages: ${JSON.stringify(response.messages)}, Headers: ${JSON.stringify(response.headers)}`,
            );
          })
          .catch((error) => {
            this.logger.error(`AI Response promise error:`, error);
          });

        // Improved stream handling with timeout
        const streamPromise = (async () => {
          for await (const delta of result.textStream) {
            if (res.destroyed || res.writableEnded) {
              this.logger.warn('Response stream ended prematurely');
              break;
            }

            if (!hasStarted) {
              this.logger.log('First chunk received, streaming started');
              hasStarted = true;
            }

            chunkCount++;
            totalContent += delta;
            res.write(delta);

            if (chunkCount % 5 === 0) {
              // More frequent logging
              this.logger.log(
                `Streamed ${chunkCount} chunks, latest chunk: "${delta.substring(0, 50)}..."`,
              );
            }
          }
        })();

        // Race between stream and timeout
        await Promise.race([
          streamPromise,
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Stream iteration timeout')),
              30000,
            ),
          ),
        ]);
      } catch (streamError) {
        this.logger.error('Error in text stream iteration:', streamError);

        // Try alternative approach - get full text
        try {
          this.logger.log('Attempting to get full text as fallback...');
          const fullText = await result.text;
          this.logger.log(
            `Fallback text received: ${fullText.length} characters`,
          );

          if (fullText && fullText.length > 0) {
            if (!res.destroyed && !res.writableEnded) {
              res.write(fullText);
              totalContent = fullText;
              chunkCount = 1;
            }
          }
        } catch (fallbackError) {
          this.logger.error('Fallback text retrieval failed:', fallbackError);
          if (!res.destroyed && !res.writableEnded) {
            res.write('\n\nSorry, there was an error in the response stream.');
          }
        }
      }

      clearTimeout(streamTimeout);

      this.logger.log(
        `Final stats - Chunks: ${chunkCount}, Content length: ${totalContent.length}`,
      );

      if (chunkCount === 0) {
        this.logger.warn(
          'No chunks received - attempting direct API call for debugging...',
        );

        // Try a simple test call to diagnose the issue
        try {
          const testResult = streamText({
            model: this.azure(this.model),
            messages: [{ role: 'user', content: 'Say hello' }],
            maxTokens: 50,
          });

          const testText = await testResult.text;
          this.logger.log(`Test call successful: ${testText}`);

          if (!res.destroyed && !res.writableEnded) {
            res.write(
              'I apologize, but I encountered a streaming issue. However, I can confirm the connection is working. Please try your request again.',
            );
          }
        } catch (testError) {
          this.logger.error('Test call also failed:', testError);
          if (!res.destroyed && !res.writableEnded) {
            res.write(
              'I apologize, but I encountered an issue with the AI service. Please try again later.',
            );
          }
        }
      }

      if (!res.destroyed && !res.writableEnded) {
        res.end();
        this.logger.log(
          `Response streaming completed with ${chunkCount} chunks`,
        );
      }
    } catch (error) {
      clearTimeout(streamTimeout);
      this.logger.error('Error in generateMedicalResponse:', error);

      if (!res.destroyed && !res.writableEnded) {
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Failed to generate response',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        } else {
          res.write('\n\nSorry, there was an error generating the response.');
          res.end();
        }
      }

      throw error;
    }
  }

  private getTools() {
    this.logger.log('Setting up tools for user context');

    return {
      list_doctors: tool({
        description: 'List all available doctors',
        parameters: z.object({}),
        execute: async () => {
          await Promise.resolve();
          return { message: 'This feature is currently unavailable' };
        },
      }),
    };
  }

  // ... rest of the methods remain the same as in your original code
  private getSystemMessage(userContext: UserContext) {
    const currentDate = new Date().toISOString().split('T')[0];
    const currentDay = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
    });

    return {
      role: 'system' as const,
      content: `You are Krista, a warm and empathetic AI medical assistant for DocXtractor Medic Application. You help users with medical appointments, prescriptions, and healthcare management in a friendly, human-like manner.

IMPORTANT USER CONTEXT:
- Current user ID: ${userContext.userId}
- User role: ${userContext.role}
- Today's date is ${currentDate} (${currentDay})
- When users ask about doctor availability, use days of the week (Monday, Tuesday, etc.)

PERSONALITY & COMMUNICATION STYLE:
- Be warm, empathetic, and conversational
- Keep responses concise and helpful
- Never overwhelm users with multiple questions
- Provide helpful guidance without being pushy
- Show understanding for user needs and concerns
- Use friendly language like "I'd be happy to help" or "Let me assist you with that"

ROLE-BASED PERMISSIONS:
PATIENTS can:
- Book appointments for themselves
- View their own appointments
- View their own prescriptions
- Check doctor availability

DOCTORS can:
- View their appointments
- View prescriptions they wrote
- Check their schedule
- Cannot book appointments for users

PHARMACISTS can:
- Manage prescriptions
- View medicine information
- Process orders

ADMINS can:
- View system data
- Manage appointments (view only, not book)
- Access all information but with restrictions

APPOINTMENT BOOKING RULES:
- Appointments are 30-minute slots only
- Accept time inputs like "4:30", "2:00", "10:30" (automatically add 30 minutes)
- Valid times: 8:00 AM - 5:30 PM (30-minute intervals)
- Never ask users to confirm doctor IDs (system handles this internally)
- If user provides invalid time, suggest nearest valid slot

APPOINTMENT BOOKING FLOW:
1. When user wants to book: "I'd be happy to help you book an appointment! Which doctor would you like to see?"
2. After doctor selection: "Great choice! What day would work best for you?"
3. After day selection: "Perfect! What time would you prefer?"
4. Complete booking with minimal confirmation

ERROR HANDLING & GUIDANCE:
- For permission issues: Explain role limitations clearly
- For unavailable features: Suggest appropriate alternatives
- If confused about user intent: Make a smart assumption and offer gentle correction if wrong

CONVERSATION EXAMPLES:
User: "I need to see a cardiologist"
Response: "I'd be happy to help you find a cardiologist! Let me show you available cardiac specialists."

User: "Book appointment at 4:30"
Response: "Perfect! I'll book your 30-minute appointment from 4:30-5:00. Which doctor would you like to see?"

RULES:
1. Use ONLY provided tools for medical queries
2. Book appointments with minimal friction - don't ask unnecessary questions
3. Be proactive in offering help
4. Keep responses warm, helpful, and concise
5. Never overwhelm with options - provide focused assistance
6. Always respect role-based permissions

You are here to make healthcare management simple and stress-free for users while respecting their role permissions.`,
    };
  }
}
