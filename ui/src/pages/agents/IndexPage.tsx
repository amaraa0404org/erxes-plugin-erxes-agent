import {
  IconHistory,
  IconPlus,
  IconSettings,
  IconSparkles,
} from '@tabler/icons-react';
import { Breadcrumb, Button, Separator } from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { Link } from 'react-router-dom';
import { useCallback, useState } from 'react';

import { ChatPanel } from '@/agents/components/ChatPanel';
import { ThreadList } from '@/agents/components/ThreadList';
import { ThreadsDrawer } from '@/agents/components/ThreadsDrawer';
import { useAgentsChat } from '@/agents/hooks/useAgentsChat';
import { useAgentsThreads } from '@/agents/hooks/useAgentsThreads';

/**
 * Full-page agents chat: conversation history beside the live chat, or — below
 * `lg`, where a 256px sidebar would leave the transcript cramped — behind a
 * left drawer opened from the header.
 */
export const IndexPage = () => {
  const chat = useAgentsChat({ sessionScope: 'page' });
  const { startNewConversation, openThread, threadId } = chat;
  const threadsState = useAgentsThreads();
  const [threadsOpen, setThreadsOpen] = useState(false);

  // Stable handlers so the memoized `ThreadList` can skip the chat's
  // per-delta re-renders.
  const handleNewConversation = useCallback(() => {
    void startNewConversation();
    setThreadsOpen(false);
  }, [startNewConversation]);

  const handleSelectThread = useCallback(
    (selectedThreadId: string) => {
      setThreadsOpen(false);
      void openThread(selectedThreadId);
    },
    [openThread],
  );

  const handleThreadDeleted = useCallback(
    (deletedThreadId: string) => {
      if (threadId === deletedThreadId) {
        void startNewConversation();
      }
    },
    [threadId, startNewConversation],
  );

  return (
    <div className="ea:flex ea:h-full ea:flex-col ea:text-sm">
      <PageHeader>
        <PageHeader.Start>
          <Button
            variant="ghost"
            size="icon"
            className="ea:lg:hidden"
            onClick={() => setThreadsOpen(true)}
            aria-label="Open conversations"
            title="Conversations"
          >
            <IconHistory />
          </Button>
          <Breadcrumb>
            <Breadcrumb.List className="ea:gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/erxes-agent/chat">
                    <IconSparkles />
                    Agents
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton
            breadcrumb={['Agents']}
            icon="IconSparkles"
          />
        </PageHeader.Start>
        <PageHeader.End className="ea:gap-1.5 ea:sm:gap-3">
          {/* Labels fold away first, so the actions never push the breadcrumb
              off a phone-width header. */}
          <Button variant="outline" asChild aria-label="Settings">
            <Link to="/settings/erxes-agent/connection">
              <IconSettings />
              <span className="ea:hidden ea:sm:inline">Settings</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={handleNewConversation}
            aria-label="New conversation"
          >
            <IconPlus />
            <span className="ea:hidden ea:sm:inline">New conversation</span>
          </Button>
        </PageHeader.End>
      </PageHeader>

      <div className="ea:flex ea:min-h-0 ea:flex-1 ea:overflow-hidden">
        <aside className="ea:hidden ea:w-64 ea:flex-none ea:border-r ea:lg:block ea:xl:w-72">
          <ThreadList
            threadsState={threadsState}
            activeThreadId={threadId}
            onSelectThread={handleSelectThread}
            onNewConversation={handleNewConversation}
            onThreadDeleted={handleThreadDeleted}
          />
        </aside>
        <main className="ea:flex ea:min-w-0 ea:flex-1">
          <ChatPanel chat={chat} />
        </main>
      </div>

      <ThreadsDrawer
        open={threadsOpen}
        onOpenChange={setThreadsOpen}
        threadsState={threadsState}
        activeThreadId={threadId}
        onSelectThread={handleSelectThread}
        onNewConversation={handleNewConversation}
        onThreadDeleted={handleThreadDeleted}
      />
    </div>
  );
};
