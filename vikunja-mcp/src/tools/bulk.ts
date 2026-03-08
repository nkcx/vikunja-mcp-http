/**
 * Bulk operations tools for Vikunja MCP server
 * Implements: bulk update operations for multiple tasks at once
 */

import { z } from 'zod';
import type { VikunjaClient } from '../client.js';
import { formatTask } from './helpers.js';

// =============================================================================
// Zod Schemas (for runtime validation)
// =============================================================================

const BulkUpdateSchema = z.object({
  taskIds: z.array(z.number()).min(1).describe('Array of task IDs to update'),
  fields: z.array(z.string()).min(1).describe('Fields to update (e.g., ["done", "priority"])'),
  values: z.object({
    title: z.string().optional().describe('New title'),
    description: z.string().optional().describe('New description'),
    done: z.boolean().optional().describe('Mark as done/undone'),
    dueDate: z.string().optional().describe('New due date (ISO 8601)'),
    startDate: z.string().optional().describe('New start date (ISO 8601)'),
    endDate: z.string().optional().describe('New end date (ISO 8601)'),
    priority: z.number().min(0).max(5).optional().describe('Priority (0=unset, 1-5)'),
    percentDone: z.number().min(0).max(100).optional().describe('Completion percentage (0-100)'),
    projectId: z.number().optional().describe('Move to project ID'),
    hexColor: z.string().optional().describe('Color code (e.g., #ff0000)'),
    repeatAfter: z.number().optional().describe('Repeat interval in seconds'),
    repeatMode: z.number().min(0).max(2).optional().describe('Repeat mode (0=after completion, 1=monthly, 2=from current)'),
    bucketId: z.number().optional().describe('Kanban bucket/column ID'),
    position: z.number().optional().describe('Position/order in list'),
    isFavorite: z.boolean().optional().describe('Mark as favorite'),
  }).describe('New values for the specified fields'),
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert camelCase field names to snake_case for API
 */
function convertFieldNames(fields: string[]): string[] {
  const fieldMap: Record<string, string> = {
    dueDate: 'due_date',
    startDate: 'start_date',
    endDate: 'end_date',
    percentDone: 'percent_done',
    projectId: 'project_id',
    hexColor: 'hex_color',
    repeatAfter: 'repeat_after',
    repeatMode: 'repeat_mode',
    bucketId: 'bucket_id',
    isFavorite: 'is_favorite',
    doneAt: 'done_at',
  };

  return fields.map(field => fieldMap[field] || field);
}

/**
 * Convert camelCase values object to snake_case for API
 */
function convertValues(values: any): any {
  const converted: any = {};

  if (values.title !== undefined) converted.title = values.title;
  if (values.description !== undefined) converted.description = values.description;
  if (values.done !== undefined) converted.done = values.done;
  if (values.dueDate !== undefined) converted.due_date = values.dueDate;
  if (values.startDate !== undefined) converted.start_date = values.startDate;
  if (values.endDate !== undefined) converted.end_date = values.endDate;
  if (values.priority !== undefined) converted.priority = values.priority;
  if (values.percentDone !== undefined) converted.percent_done = values.percentDone;
  if (values.projectId !== undefined) converted.project_id = values.projectId;
  if (values.hexColor !== undefined) converted.hex_color = values.hexColor;
  if (values.repeatAfter !== undefined) converted.repeat_after = values.repeatAfter;
  if (values.repeatMode !== undefined) converted.repeat_mode = values.repeatMode;
  if (values.bucketId !== undefined) converted.bucket_id = values.bucketId;
  if (values.position !== undefined) converted.position = values.position;
  if (values.isFavorite !== undefined) converted.is_favorite = values.isFavorite;

  return converted;
}

// =============================================================================
// Tool Functions
// =============================================================================

/**
 * Update multiple tasks at once
 */
export async function tasksBulkUpdate(client: VikunjaClient, args: unknown): Promise<string> {
  const params = BulkUpdateSchema.parse(args);

  try {
    // Mass operation safeguard: warn if updating many tasks
    const isMassOperation = params.taskIds.length > 10;

    // Convert field names and values to snake_case
    const fields = convertFieldNames(params.fields);
    const values = convertValues(params.values);

    // Perform bulk update
    const updatedTasks = await client.bulkUpdateTasks({
      task_ids: params.taskIds,
      fields: fields,
      values: values,
    });

    const lines: string[] = [];

    // Add mass operation warning if applicable
    if (isMassOperation) {
      lines.push('WARNING: MASS OPERATION');
      lines.push('');
      lines.push(`This operation updated ${updatedTasks.length} tasks simultaneously.`);
      lines.push('Please verify the changes are correct.');
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    lines.push(`Successfully updated ${updatedTasks.length} task(s)`);
    lines.push('');
    lines.push(`Task IDs: ${params.taskIds.join(', ')}`);
    lines.push(`Updated fields: ${params.fields.join(', ')}`);
    lines.push('');
    lines.push('Updated values:');
    for (const [key, value] of Object.entries(params.values)) {
      if (value !== undefined) {
        lines.push(`  ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
      }
    }
    lines.push('');
    lines.push('Updated tasks:');
    lines.push('');

    updatedTasks.forEach((task, index) => {
      lines.push(`${index + 1}. ${formatTask(task)}`);
      if (index < updatedTasks.length - 1) {
        lines.push('');
      }
    });

    lines.push('');
    lines.push('TIP: Use tasks_list to verify all tasks were updated correctly.');

    return lines.join('\n');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to bulk update tasks: ${message}`);
  }
}

// =============================================================================
// JSON Schema Definitions (manually defined for MCP compatibility)
// =============================================================================

const BulkUpdateJsonSchema = {
  type: 'object' as const,
  properties: {
    taskIds: {
      type: 'array' as const,
      items: {
        type: 'number' as const,
      },
      description: 'Array of task IDs to update (at least 1 required)',
    },
    fields: {
      type: 'array' as const,
      items: {
        type: 'string' as const,
      },
      description: 'Fields to update - must match the keys in values object. Examples: "done", "priority", "dueDate", "projectId"',
    },
    values: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string' as const,
          description: 'New title for all tasks',
        },
        description: {
          type: 'string' as const,
          description: 'New description for all tasks',
        },
        done: {
          type: 'boolean' as const,
          description: 'Mark all tasks as done (true) or undone (false)',
        },
        dueDate: {
          type: 'string' as const,
          description: 'New due date in ISO 8601 format (e.g., "2024-12-31T23:59:59Z")',
        },
        startDate: {
          type: 'string' as const,
          description: 'New start date in ISO 8601 format',
        },
        endDate: {
          type: 'string' as const,
          description: 'New end date in ISO 8601 format',
        },
        priority: {
          type: 'number' as const,
          description: 'Priority level: 0=unset, 1=low, 2=medium, 3=high, 4=urgent, 5=critical',
        },
        percentDone: {
          type: 'number' as const,
          description: 'Completion percentage (0-100)',
        },
        projectId: {
          type: 'number' as const,
          description: 'Move all tasks to this project ID',
        },
        hexColor: {
          type: 'string' as const,
          description: 'Color code in hex format (e.g., "#ff0000")',
        },
        repeatAfter: {
          type: 'number' as const,
          description: 'Repeat interval in seconds',
        },
        repeatMode: {
          type: 'number' as const,
          description: 'Repeat mode: 0=after completion, 1=monthly, 2=from current date',
        },
        bucketId: {
          type: 'number' as const,
          description: 'Kanban bucket/column ID for task positioning',
        },
        position: {
          type: 'number' as const,
          description: 'Position/order number within the list or bucket',
        },
        isFavorite: {
          type: 'boolean' as const,
          description: 'Mark all tasks as favorite (true) or unfavorite (false)',
        },
      },
      description: 'New values to apply to all specified tasks. Only include fields you want to update.',
    },
  },
  required: ['taskIds', 'fields', 'values'],
};

// =============================================================================
// Tool Definitions Export
// =============================================================================

export const bulkTools = [
  {
    name: 'tasks_bulk_update',
    description:
      'Update multiple tasks atomically with the same values. Efficient for batch operations. ' +
      'All tasks must be writable. The fields array must match keys in values object. ' +
      'WHEN TO USE: Marking many tasks done, changing priority/project, organizing in kanban, marking favorites. ' +
      'EXAMPLE: {taskIds: [1, 2, 3], fields: ["done"], values: {done: true}}',
    inputSchema: BulkUpdateJsonSchema,
  },
];
