import type { FC } from "react";
import { useTranslation } from "../../hooks/use-translation.ts";
import {
  createFieldSchema,
  renameObjectProperty,
  updateObjectProperty,
  updatePropertyRequired,
} from "../../lib/schemaEditor.ts";
import type { JSONSchema, NewField } from "../../types/jsonSchema.ts";
import { asObjectSchema, isBooleanSchema } from "../../types/jsonSchema.ts";
import AddFieldButton from "./AddFieldButton.tsx";
import SchemaFieldList from "./SchemaFieldList.tsx";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion.tsx";
import { EmptyBlock } from "@/components/EmptyBlock.tsx";



/** @public */
export interface SchemaVisualEditorProps {
  schema: JSONSchema;
  readOnly: boolean;
  onChange: (schema: JSONSchema) => void;
}

/** @public */
const SchemaVisualEditor: FC<SchemaVisualEditorProps> = ({
  schema,
  onChange,
  readOnly = false,
}) => {
  const t = useTranslation();
  // Handle adding a top-level field
  const handleAddField = (newField: NewField) => {
    // Create a field schema based on the new field data
    const fieldSchema = createFieldSchema(newField);

    // Add the field to the schema
    let newSchema = updateObjectProperty(
      asObjectSchema(schema),
      newField.name,
      fieldSchema,
    );

    // Update required status if needed
    if (newField.required) {
      newSchema = updatePropertyRequired(newSchema, newField.name, true);
    }

    // Update the schema
    onChange(newSchema);
  };

  // Handle editing a top-level field
  const handleEditField = (name: string, updatedField: NewField) => {
    // Create a field schema based on the updated field data
    const fieldSchema = createFieldSchema(updatedField);

    let newSchema = asObjectSchema(schema);

    // If name changed, rename the property while preserving order
    if (name !== updatedField.name) {
      newSchema = renameObjectProperty(newSchema, name, updatedField.name);
      // Update the field schema after rename
      newSchema = updateObjectProperty(
        newSchema,
        updatedField.name,
        fieldSchema,
      );
    } else {
      // Name didn't change, just update the schema
      newSchema = updateObjectProperty(newSchema, name, fieldSchema);
    }

    // Update required status
    newSchema = updatePropertyRequired(
      newSchema,
      updatedField.name,
      updatedField.required || false,
    );

    // Update the schema
    onChange(newSchema);
  };

  // Handle deleting a top-level field
  const handleDeleteField = (name: string) => {
    // Check if the schema is valid first
    if (isBooleanSchema(schema) || !schema.properties) {
      return;
    }

    // Create a new schema without the field
    const { [name]: _, ...remainingProps } = schema.properties;

    const newSchema = {
      ...schema,
      properties: remainingProps,
    };

    // Remove from required array if present
    if (newSchema.required) {
      newSchema.required = newSchema.required.filter((field) => field !== name);
    }

    // Update the schema
    onChange(newSchema);
  };

  const hasFields =
    !isBooleanSchema(schema) &&
    schema.properties &&
    Object.keys(schema.properties).length > 0;

  return (
    <div>
      <AccordionItem value="schema" className="bg-white xdark:bg-surface-dark rounded-xl shadow-subtle border border-border-light xdark:border-border-dark overflow-hidden flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between border-b border-border-light xdark:border-border-dark pr-4">
          <AccordionTrigger className="flex-1 px-6 py-5 hover:bg-gray-50 transition-colors hover:no-underline text-lg border-none">
            <div className="flex flex-col text-left">
              <h3 className="font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  schema
                </span>
                Field Schema
              </h3>
              <p className="text-xs text-text-secondary-light xdark:text-text-secondary-dark mt-1 font-normal">
                Define the data points to be extracted from the documents.
              </p>
            </div>
          </AccordionTrigger>
          <div onClick={(e) => e.stopPropagation()}>
            {!readOnly && (
              <div className="shrink-0 mb-0">
                <AddFieldButton onAddField={handleAddField} />
              </div>
            )}
          </div>
        </div>
        <AccordionContent className="p-0">
          <div className="min-h-[400px] max-h-[1600px] bg-white text-left xdark:bg-surface-dark border-b border-border-light xdark:border-border-dark">
            <div className="jsonjoy h-full">
              <div className="p-4 h-full flex flex-col overflow-auto jsonjoy">


                <div className="grow overflow-auto">
                  {!hasFields ? (
                    <EmptyBlock
                      className="border-0 pt-16"
                      title={t.visualEditorNoFieldsHint1}
                      description={t.visualEditorNoFieldsHint2}
                    />

                  ) : (
                    <SchemaFieldList
                      schema={schema}
                      readOnly={readOnly}
                      onAddField={handleAddField}
                      onEditField={handleEditField}
                      onDeleteField={handleDeleteField}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>




    </div>
  );
};

export default SchemaVisualEditor;
