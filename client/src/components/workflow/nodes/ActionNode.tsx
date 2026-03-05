import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import { BaseWorkflowNode } from "./BaseWorkflowNode";
import {
  Mail,
  Webhook,
  Table,
  ScanLine,
  Database,
  FileOutput,
} from "lucide-react";

export const ActionNode = memo((props: NodeProps) => {
  const { type } = props.data;

  // Select icon, icon background, and header background based on action type
  let icon = <Webhook className="w-5 h-5 stroke-[2.5]" />;
  let iconBg = "#D1FAE5"; // Green
  let headerBg = "#C8E6C9"; // Light green

  if (type === "send_email") {
    icon = <Mail className="w-5 h-5 stroke-[2.5]" />;
    iconBg = "#FBCFE8"; // Pink
    headerBg = "#FCE7F3";
  } else if (type === "extract_data") {
    icon = <ScanLine className="w-5 h-5 stroke-[2.5]" />;
    iconBg = "#FEF08A"; // Yellow
    headerBg = "#fde047"; // Bright yellow
  } else if (type === "google_sheets" || type === "write_to_sheet") {
    icon = <Table className="w-5 h-5 stroke-[2.5]" />;
    iconBg = "#BBF7D0"; // Emerald
    headerBg = "#D1FAE5";
  } else if (type === "save_to_database") {
    icon = <Database className="w-5 h-5 stroke-[2.5]" />;
    iconBg = "#BFDBFE"; // Blue
    headerBg = "#DBEAFE";
  } else if (type === "webhook_action") {
    icon = <Webhook className="w-5 h-5 stroke-[2.5]" />;
    iconBg = "#C7D2FE"; // Indigo
    headerBg = "#E0E7FF";
  } else if (type === "save_to_file") {
    icon = <FileOutput className="w-5 h-5 stroke-[2.5]" />;
    iconBg = "#FED7AA"; // Orange
    headerBg = "#FFEDD5";
  }

  return (
    <BaseWorkflowNode
      {...props}
      headerBgColor={headerBg}
      headerIconBg={iconBg}
      data={{
        ...props.data,
        icon,
      }}
    />
  );
});

ActionNode.displayName = "ActionNode";
