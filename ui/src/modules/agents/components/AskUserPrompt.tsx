import {
  IconArrowUp,
  IconCheck,
  IconCircle,
  IconCircleCheckFilled,
  IconLoader2,
  IconMessageQuestion,
  IconSquare,
  IconSquareCheckFilled,
} from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { useId, useState } from 'react';

import type { IAskUserAnswerEntry } from '../askUserAnswers';
import { buildQuestionAnswer, hasQuestionAnswer } from '../questionDrafts';
import { ChatInput } from './ChatInput';

export interface IAskUserQuestionEntry {
  question: string;
  options?: { label: string; description?: string }[];
  selectionMode?: 'single_select' | 'multi_select';
}

export interface IAskUserQuestionGroup {
  questions: IAskUserQuestionEntry[];
}

export interface IAskUserPromptProps {
  group: IAskUserQuestionGroup;
  busy: boolean;
  onAnswer: (answer: string | string[] | (string | string[])[]) => void;
}

/** Choices and custom answers share one explicit submission path. */
export const AskUserPrompt = ({
  group,
  busy,
  onAnswer,
}: IAskUserPromptProps) => {
  const { questions } = group;
  const id = useId();
  const [picked, setPicked] = useState<string[][]>(() =>
    questions.map(() => []),
  );
  const [drafts, setDrafts] = useState<string[]>(() => questions.map(() => ''));
  const answers = questions.map((question, index) =>
    buildQuestionAnswer(question, picked[index] ?? [], drafts[index] ?? ''),
  );
  const answeredCount = answers.filter(hasQuestionAnswer).length;
  const allAnswered =
    questions.length > 0 && answeredCount === questions.length;

  const togglePick = (index: number, label: string) => {
    if (busy) return;
    setPicked((current) =>
      current.map((selection, i) => {
        if (i !== index) return selection;
        if (selection.includes(label))
          return selection.filter((value) => value !== label);
        return questions[index]?.selectionMode === 'multi_select'
          ? [...selection, label]
          : [label];
      }),
    );
  };

  const submit = () => {
    if (busy || !allAnswered) return;
    const first = answers[0];
    if (first === undefined) return;
    onAnswer(questions.length === 1 ? first : answers);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="ea:my-1 ea:overflow-hidden ea:rounded-2xl ea:border ea:bg-background ea:text-foreground"
      aria-label="Questions from your agent"
    >
      <div className="ea:flex ea:items-center ea:gap-3 ea:px-4 ea:py-4 ea:sm:px-5">
        <div className="ea:flex ea:size-8 ea:shrink-0 ea:items-center ea:justify-center ea:rounded-lg ea:bg-primary/10 ea:text-primary">
          <IconMessageQuestion className="ea:size-4" />
        </div>
        <div>
          <p className="ea:text-sm ea:font-medium">
            {questions.length === 1
              ? 'One detail before I continue'
              : 'A few details before I continue'}
          </p>
          <p className="ea:mt-1 ea:text-xs ea:text-muted-foreground">
            Choose an option, write your own answer, or add details to your
            choices.
          </p>
        </div>
      </div>

      <div className="ea:divide-y ea:border-t">
        {questions.map((question, index) => {
          const multi = question.selectionMode === 'multi_select';
          const selected = picked[index] ?? [];
          const hasOptions = Boolean(question.options?.length);
          const labelId = `${id}-${index}`;
          return (
            <section
              key={index}
              className="ea:space-y-3 ea:px-4 ea:py-4 ea:sm:px-5 ea:sm:py-5"
              aria-labelledby={labelId}
            >
              <div className="ea:flex ea:items-start ea:gap-2.5">
                {questions.length > 1 && (
                  <span className="ea:flex ea:size-5 ea:shrink-0 ea:items-center ea:justify-center ea:rounded-full ea:bg-muted ea:text-[11px] ea:font-medium ea:text-muted-foreground">
                    {index + 1}
                  </span>
                )}
                <div className="ea:min-w-0">
                  <h3 id={labelId} className="ea:text-sm ea:font-medium ea:leading-5">
                    {question.question}
                  </h3>
                  {hasOptions && (
                    <p className="ea:mt-1 ea:text-xs ea:text-muted-foreground">
                      {multi ? 'Choose any that apply' : 'Choose one'}
                      {multi && selected.length > 0
                        ? ` · ${selected.length} selected`
                        : ''}
                    </p>
                  )}
                </div>
              </div>

              {hasOptions && (
                <div
                  className="ea:grid ea:grid-cols-1 ea:gap-2 ea:sm:grid-cols-2"
                  role="group"
                  aria-labelledby={labelId}
                >
                  {question.options?.map((option) => {
                    const active = selected.includes(option.label);
                    const Icon = multi
                      ? active
                        ? IconSquareCheckFilled
                        : IconSquare
                      : active
                      ? IconCircleCheckFilled
                      : IconCircle;
                    return (
                      <Button
                        key={option.label}
                        type="button"
                        variant="outline"
                        disabled={busy}
                        aria-pressed={active}
                        onClick={() => togglePick(index, option.label)}
                        className={`ea:h-auto ea:min-h-11 ea:justify-start ea:gap-3 ea:whitespace-normal ea:rounded-xl ea:px-3 ea:py-2.5 ea:text-left ea:shadow-none ${
                          active
                            ? 'ea:border-primary ea:bg-primary/5 ea:text-primary ea:hover:bg-primary/10'
                            : 'ea:border-border ea:hover:bg-muted/40'
                        }`}
                      >
                        <Icon
                          aria-hidden="true"
                          className={`ea:size-4 ea:shrink-0 ${
                            active ? 'ea:text-primary' : 'ea:text-muted-foreground/60'
                          }`}
                        />
                        <span className="ea:min-w-0 ea:break-words">
                          <span className="ea:block ea:text-sm ea:font-medium">
                            {option.label}
                          </span>
                          {option.description && (
                            <span className="ea:mt-1 ea:block ea:text-xs ea:font-normal ea:leading-4 ea:text-muted-foreground">
                              {option.description}
                            </span>
                          )}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              )}

              <div className="ea:rounded-xl ea:border ea:bg-muted/20 ea:px-3 ea:py-2.5 ea:transition-colors ea:focus-within:border-primary/50 ea:focus-within:bg-background">
                <ChatInput
                  value={drafts[index] ?? ''}
                  onChange={(value) =>
                    setDrafts((current) =>
                      current.map((draft, i) => (i === index ? value : draft)),
                    )
                  }
                  placeholder={
                    hasOptions
                      ? 'Your own answer or additional details…'
                      : 'Type your answer…'
                  }
                  ariaLabel={`Your answer: ${question.question}`}
                  disabled={busy}
                  maxHeight={144}
                  className="ea:text-sm ea:md:text-sm"
                />
              </div>
            </section>
          );
        })}
      </div>

      <div className="ea:flex ea:items-center ea:justify-between ea:gap-3 ea:border-t ea:bg-muted/20 ea:px-4 ea:py-3 ea:sm:px-5">
        <p
          className="ea:text-xs ea:text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {busy
            ? 'Sending your answers…'
            : allAnswered
            ? 'Ready when you are'
            : `${answeredCount} of ${questions.length} answered`}
        </p>
        <Button
          type="submit"
          size="sm"
          disabled={busy || !allAnswered}
          className="ea:shrink-0 ea:rounded-lg"
        >
          {busy ? (
            <IconLoader2 className="ea:size-4 ea:animate-spin" />
          ) : (
            <IconArrowUp className="ea:size-4" />
          )}
          {busy ? 'Sending…' : 'Continue'}
        </Button>
      </div>
    </form>
  );
};

/** Compact persisted summary replaces the active form after submission. */
export const AskUserAnswered = ({
  answers,
}: {
  answers: IAskUserAnswerEntry[];
}) => (
  <div className="ea:my-2 ea:space-y-3 ea:border-l-2 ea:border-primary/25 ea:py-1 ea:pl-4 ea:text-foreground">
    <p className="ea:flex ea:items-center ea:gap-1.5 ea:text-xs ea:font-medium ea:text-muted-foreground">
      <IconCheck className="ea:size-3.5 ea:text-primary" />
      Your answers
    </p>
    {answers.map((entry, index) => (
      <div key={index}>
        <p className="ea:text-xs ea:text-muted-foreground">{entry.question}</p>
        <p className="ea:mt-1 ea:whitespace-pre-wrap ea:break-words ea:text-sm ea:leading-6">
          {entry.answer}
        </p>
      </div>
    ))}
  </div>
);
