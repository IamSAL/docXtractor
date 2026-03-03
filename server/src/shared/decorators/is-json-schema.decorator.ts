import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({
  allErrors: true,
  strict: false, // Don't be too strict on meta-schemas
});
addFormats(ajv);

@ValidatorConstraint({ name: 'isJsonSchema', async: false })
export class IsJsonSchemaConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    try {
      // Validate against the meta-schema
      const isValid = ajv.validateSchema(value);
      return !!isValid;
    } catch {
      return false;
    }
  }

  defaultMessage() {
    return 'The provided schema is not a valid JSON Schema';
  }
}

export function IsJsonSchema(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsJsonSchemaConstraint,
    });
  };
}
