import { type FC, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTranslation } from "../../hooks/use-translation.ts";
import { getSchemaProperties, reorderFields } from "../../lib/schemaEditor.ts";
import type {
  JSONSchema as JSONSchemaType,
  NewField,
  ObjectJSONSchema,
  SchemaType,
} from "../../types/jsonSchema.ts";
import { buildValidationTree } from "../../types/validation.ts";
import SchemaPropertyEditor from "./SchemaPropertyEditor.tsx";

interface SchemaFieldListProps {
  schema: JSONSchemaType;
  readOnly: boolean;
  onAddField: (newField: NewField) => void;
  onEditField: (name: string, updatedField: NewField) => void;
  onDeleteField: (name: string) => void;
  onReorderFields?: (updatedSchema: ObjectJSONSchema) => void;
}

const SchemaFieldList: FC<SchemaFieldListProps> = ({
  schema,
  onEditField,
  onDeleteField,
  onReorderFields,
  readOnly = false,
}) => {
  const t = useTranslation();

  // Get the properties from the schema
  const properties = getSchemaProperties(schema);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onReorderFields) {
      const oldIndex = properties.findIndex((p) => p.name === active.id);
      const newIndex = properties.findIndex((p) => p.name === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const updatedSchema = reorderFields(
          schema as ObjectJSONSchema,
          oldIndex,
          newIndex,
        );
        onReorderFields(updatedSchema);
      }
    }
  };

  // Get schema type as a valid SchemaType
  const getValidSchemaType = (propSchema: JSONSchemaType): SchemaType => {
    if (typeof propSchema === "boolean") return "object";

    // Handle array of types by picking the first one
    const type = propSchema.type;
    if (Array.isArray(type)) {
      return type[0] || "object";
    }

    return type || "object";
  };

  // Handle field name change (generates an edit event)
  const handleNameChange = (oldName: string, newName: string) => {
    const property = properties.find((prop) => prop.name === oldName);
    if (!property) return;

    onEditField(oldName, {
      name: newName,
      type: getValidSchemaType(property.schema),
      description:
        typeof property.schema === "boolean"
          ? ""
          : property.schema.description || "",
      required: property.required,
      validation:
        typeof property.schema === "boolean"
          ? { type: "object" }
          : property.schema,
    });
  };

  // Handle required status change
  const handleRequiredChange = (name: string, required: boolean) => {
    const property = properties.find((prop) => prop.name === name);
    if (!property) return;

    onEditField(name, {
      name,
      type: getValidSchemaType(property.schema),
      description:
        typeof property.schema === "boolean"
          ? ""
          : property.schema.description || "",
      required,
      validation:
        typeof property.schema === "boolean"
          ? { type: "object" }
          : property.schema,
    });
  };

  // Handle schema change
  const handleSchemaChange = (
    name: string,
    updatedSchema: ObjectJSONSchema,
  ) => {
    const property = properties.find((prop) => prop.name === name);
    if (!property) return;

    const type = updatedSchema.type || "object";
    // Ensure we're using a single type, not an array of types
    const validType = Array.isArray(type) ? type[0] || "object" : type;

    onEditField(name, {
      name,
      type: validType,
      description: updatedSchema.description || "",
      required: property.required,
      validation: updatedSchema,
    });
  };

  const validationTree = useMemo(
    () => buildValidationTree(schema, t),
    [schema, t],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col animate-in">
        {/* Header Row */}
        <div className="grid grid-cols-[48px_1fr_120px_100px_48px_48px] items-center py-3 px-2 border-b-2 border-black bg-gray-50/50 text-[10px] font-bold uppercase tracking-widest text-text-secondary-light">
          <div className="text-center">#</div>
          <div className="px-3">Field / Property</div>
          <div className="text-center">Type</div>
          <div className="text-center">Required</div>
          <div className="text-center">Action</div>
          <div className="text-center">View</div>
        </div>

        <SortableContext
          items={properties.map((p) => p.name)}
          strategy={verticalListSortingStrategy}
        >
          <div className="overflow-visible divide-y divide-border-light xdark:divide-border-dark border-x border-b border-border-light xdark:border-border-dark overflow-hidden">
            {properties.map((property) => (
              <SchemaPropertyEditor
                key={property.name}
                name={property.name}
                schema={property.schema}
                required={property.required}
                validationNode={validationTree.children[property.name] ?? undefined}
                onDelete={() => onDeleteField(property.name)}
                onNameChange={(newName) => handleNameChange(property.name, newName)}
                onRequiredChange={(required) =>
                  handleRequiredChange(property.name, required)
                }
                onSchemaChange={(schema) => handleSchemaChange(property.name, schema)}
                readOnly={readOnly}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </DndContext>
  );
};

export default SchemaFieldList;
