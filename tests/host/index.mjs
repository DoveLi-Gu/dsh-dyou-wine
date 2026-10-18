import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';

export const name = 'dsh-dyou-wine-test-seed';
export const inject = ['sessions', 'sessionController', 'workspaceRegistry'];
export const sessionId = 'wine-acceptance-seed';
export const title = 'D友の酒 · 本地验收';

const identity = () => `wine-test-${randomUUID()}`;
const source = { kind: 'model', provider: 'wine-local-test', model: 'deterministic-seed-no-network' };
const text = value => ({ type: 'text', text: value });
const streamFor = value => [{ type: 'text-chunks', time0: Date.now(), index: 0, dt: [0], texts: [value] }];

/** Uses the same append API as Host producers. No DOM injection or model execution. */
export function seedSession(session) {
  const surface = { surfaceOp: 'append' };
  const turn = 0;
  const callId = 'wine-local-tool-preview';
  session.append('turn/start', { turn });
  session.append('step/start', { turn, step: 0 });
  session.append('user/message', {
    id: identity(), role: 'user', source: { kind: 'user' },
    content: [text('请展示 D友の酒 的消息、正文、工具卡、输入框和侧栏动画。此会话是本地确定性验收数据，不请求模型。')],
  }, surface);
  session.append('assistant/message', {
    turn, step: 0,
    message: { id: identity(), role: 'assistant', source, content: [
      text('先查看一份只读示例。工具卡也应与正文一起轻弹。'),
      { type: 'tool-call', id: callId, name: 'read_file', arguments: '{"path":"wine-test-example.txt"}' },
    ] },
    stream: [],
  }, surface);
  session.append('tool/call', { turn, step: 0, callId, name: 'read_file', arguments: '{"path":"wine-test-example.txt"}' });
  session.append('tool/result', { turn, step: 0, message: {
    id: identity(), role: 'tool', source: { kind: 'tool', callId }, toolCallId: callId,
    content: [text('只读测试结果：这是预置文本；没有读取文件、执行命令或访问网络。')],
  } }, surface);
  session.append('step/end', { turn, step: 0 });
  session.append('step/start', { turn, step: 1 });
  const answer = [
    '## D友の酒，本地验收',
    '',
    '这段正文由真实 DSH 的 Markdown 组件渲染。开喝后，消息外框、段落、工具卡、输入框和侧栏会分别参与 Q 弹。',
    '',
    '可以点击输入框、选择这段文字，或将鼠标移到按钮上，对应区域应暂时静止。',
    '',
    '```ts',
    'const drink = "D友の酒";',
    'console.log("醒酒后，宿主 DOM 和样式保持原样。");',
    '```',
    '',
    '**测试来源说明：**以上内容是测试插件写入的确定性会话事件，未调用任何模型；画面使用未经替换的真实 DSH 组件。',
  ].join('\n');
  session.append('assistant/message', { turn, step: 1,
    message: { id: identity(), role: 'assistant', source, content: [text(answer)] },
    stream: streamFor(answer),
  }, surface);
  session.append('step/end', { turn, step: 1 });
  session.append('turn/end', { turn, reason: { kind: 'completed' } });
}

export async function apply(ctx) {
  if (process.env.DSH_WINE_TEST_SEED !== '1' || !process.env.DSH_HOME) {
    throw new Error('Test seed requires explicit DSH_WINE_TEST_SEED=1 and an isolated DSH_HOME.');
  }
  const home = resolve(process.env.DSH_HOME);
  const cwd = join(home, 'wine-acceptance-workspace');
  await mkdir(cwd, { recursive: true });
  const workspace = await ctx.workspaceRegistry.create(cwd, 'D友の酒 验收工作区');
  // A session created only by cwd is absent from the workspace-filtered sidebar.
  // The public create-by-workspace path also durably attaches the Session to it.
  await ctx.sessionController.create({ sessionId, workspaceId: workspace.id });
  // A user-owned title prevents the optional automatic title provider from calling a model.
  await ctx.sessionController.rename({ sessionId, title });
  const session = ctx.sessions.get(sessionId);
  if (!session) throw new Error('Test session was not published.');
  if (!session.deriveMessages().some(message => message.role === 'user')) seedSession(session);
  await ctx.sessions.flush(session);
  console.log(`DSH_WINE_SEED_READY ${JSON.stringify({ sessionId, title, cwd, workspaceId: workspace.id, workspaceTitle: workspace.title })}`);
}
