#!/usr/bin/env node
/**
 * Vikunja MCP Server
 * Model Context Protocol server for Vikunja task management
 */

// CRITICAL: Load environment variables conditionally
// This prevents stdout pollution in MCP clients where env vars are set directly
import { config as dotenvConfig } from 'dotenv';
if (!process.env.VIKUNJA_URL || !process.env.VIKUNJA_API_TOKEN) {
  dotenvConfig({ debug: false }); // Silent mode - no stdout output
}

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { config } from './config.js';
import { VikunjaClient } from './client.js';
import {
  getToolDefinitions,
  // Tasks
  tasksList,
  tasksListAll,
  taskGet,
  taskCreate,
  taskUpdate,
  taskComplete,
  taskDelete,
  // Projects
  projectsList,
  projectGet,
  projectCreate,
  projectUpdate,
  projectArchive,
  projectDelete,
  projectDuplicate,
  // Labels
  labelsList,
  labelGet,
  labelCreate,
  labelUpdate,
  labelDelete,
  labelAddToTask,
  labelRemoveFromTask,
  labelsBulkSetOnTask,
  // Comments
  commentsList,
  commentGet,
  commentCreate,
  commentUpdate,
  commentDelete,
  // Assignees
  assigneesList,
  assigneeAdd,
  assigneesAddBulk,
  assigneeRemove,
  // Relations
  relationCreate,
  relationDelete,
  // Filters
  filterGet,
  filterCreate,
  filterUpdate,
  filterDelete,
  // Bulk Operations
  tasksBulkUpdate,
  // Notifications
  notificationsList,
  notificationGet,
  notificationDelete,
  // Subscriptions
  subscriptionGet,
  subscriptionCreate,
  subscriptionDelete,
  // Info
  infoGet,
  // Views
  viewsList,
  viewGet,
  viewCreate,
  viewUpdate,
  viewDelete,
  // Buckets
  bucketsList,
  bucketCreate,
  bucketUpdate,
  bucketDelete,
} from './tools/index.js';

// Initialize Vikunja API client
const client = new VikunjaClient(config);

// Create MCP server
const server = new Server(
  {
    name: 'vikunja-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ============================================================================
// Request Handlers
// ============================================================================

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: getToolDefinitions(),
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    let result: string;

    console.error(`[Server] Tool call: ${name}`);

    // Route to appropriate tool handler
    switch (name) {
      // Task tools
      case 'tasks_list':
        result = await tasksList(client, args ?? {});
        break;

      case 'task_get':
        result = await taskGet(client, args ?? {});
        break;

      case 'task_create':
        result = await taskCreate(client, args ?? {});
        break;

      case 'task_update':
        result = await taskUpdate(client, args ?? {});
        break;

      case 'task_complete':
        result = await taskComplete(client, args ?? {});
        break;

      case 'task_delete':
        result = await taskDelete(client, args ?? {});
        break;

      case 'tasks_list_all':
        result = await tasksListAll(client, args ?? {});
        break;

      // Project tools
      case 'projects_list':
        result = await projectsList(client, args ?? {});
        break;

      case 'project_get':
        result = await projectGet(client, args ?? {});
        break;

      case 'project_create':
        result = await projectCreate(client, args ?? {});
        break;

      case 'project_update':
        result = await projectUpdate(client, args ?? {});
        break;

      case 'project_archive':
        result = await projectArchive(client, args ?? {});
        break;

      case 'project_delete':
        result = await projectDelete(client, args ?? {});
        break;

      case 'project_duplicate':
        result = await projectDuplicate(client, args ?? {});
        break;

      // Label tools
      case 'labels_list':
        result = await labelsList(client, args ?? {});
        break;

      case 'label_get':
        result = await labelGet(client, args ?? {});
        break;

      case 'label_create':
        result = await labelCreate(client, args ?? {});
        break;

      case 'label_update':
        result = await labelUpdate(client, args ?? {});
        break;

      case 'label_delete':
        result = await labelDelete(client, args ?? {});
        break;

      case 'label_add_to_task':
        result = await labelAddToTask(client, args ?? {});
        break;

      case 'label_remove_from_task':
        result = await labelRemoveFromTask(client, args ?? {});
        break;

      case 'labels_bulk_set_on_task':
        result = await labelsBulkSetOnTask(client, args ?? {});
        break;

      // Comment tools
      case 'comments_list':
        result = await commentsList(client, args ?? {});
        break;

      case 'comment_get':
        result = await commentGet(client, args ?? {});
        break;

      case 'comment_create':
        result = await commentCreate(client, args ?? {});
        break;

      case 'comment_update':
        result = await commentUpdate(client, args ?? {});
        break;

      case 'comment_delete':
        result = await commentDelete(client, args ?? {});
        break;

      // Assignee tools
      case 'assignees_list':
        result = await assigneesList(client, args ?? {});
        break;

      case 'assignee_add':
        result = await assigneeAdd(client, args ?? {});
        break;

      case 'assignees_add_bulk':
        result = await assigneesAddBulk(client, args ?? {});
        break;

      case 'assignee_remove':
        result = await assigneeRemove(client, args ?? {});
        break;

      // Relation tools
      case 'relation_create':
        result = await relationCreate(client, args ?? {});
        break;

      case 'relation_delete':
        result = await relationDelete(client, args ?? {});
        break;

      // Filter tools
      case 'filter_get':
        result = await filterGet(client, args ?? {});
        break;

      case 'filter_create':
        result = await filterCreate(client, args ?? {});
        break;

      case 'filter_update':
        result = await filterUpdate(client, args ?? {});
        break;

      case 'filter_delete':
        result = await filterDelete(client, args ?? {});
        break;

      // Bulk operation tools
      case 'tasks_bulk_update':
        result = await tasksBulkUpdate(client, args ?? {});
        break;

      // Notification tools
      case 'notifications_list':
        result = await notificationsList(client, args ?? {});
        break;

      case 'notification_get':
        result = await notificationGet(client, args ?? {});
        break;

      case 'notification_delete':
        result = await notificationDelete(client, args ?? {});
        break;

      // Subscription tools
      case 'subscription_get':
        result = await subscriptionGet(client, args ?? {});
        break;

      case 'subscription_create':
        result = await subscriptionCreate(client, args ?? {});
        break;

      case 'subscription_delete':
        result = await subscriptionDelete(client, args ?? {});
        break;

      // Info tools
      case 'info_get':
        result = await infoGet(client, args ?? {});
        break;

      // View tools
      case 'views_list':
        result = await viewsList(client, args ?? {});
        break;

      case 'view_get':
        result = await viewGet(client, args ?? {});
        break;

      case 'view_create':
        result = await viewCreate(client, args ?? {});
        break;

      case 'view_update':
        result = await viewUpdate(client, args ?? {});
        break;

      case 'view_delete':
        result = await viewDelete(client, args ?? {});
        break;

      // Bucket tools
      case 'buckets_list':
        result = await bucketsList(client, args ?? {});
        break;

      case 'bucket_create':
        result = await bucketCreate(client, args ?? {});
        break;

      case 'bucket_update':
        result = await bucketUpdate(client, args ?? {});
        break;

      case 'bucket_delete':
        result = await bucketDelete(client, args ?? {});
        break;

      // Unknown tool
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Server] Tool error: ${errorMessage}`);

    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// ============================================================================
// Server Lifecycle
// ============================================================================

/**
 * Start the MCP server
 */
async function main() {
  console.error('========================================');
  console.error('Vikunja MCP Server');
  console.error('========================================');
  console.error('[Server] Starting...');
  console.error('[Server] Configuration loaded:');
  console.error(`[Server]   API URL: ${config.apiUrl}`);
  console.error(`[Server]   SSL Verification: ${config.verifySsl}`);
  console.error('');

  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('[Server] ✅ Vikunja MCP Server running');
    console.error('[Server] Ready to accept requests');
    console.error('');
  } catch (error) {
    console.error('[Server] ❌ Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Handle graceful shutdown
 */
function shutdown(signal: string) {
  console.error('');
  console.error(`[Server] Received ${signal}, shutting down gracefully...`);
  process.exit(0);
}

// Register signal handlers
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled rejection:', reason);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  console.error('[Server] Fatal error:', error);
  process.exit(1);
});
