import { renderMarkdown } from '../lib/md';

export default function StaticPage({ title, content }: { title: string; content: string }) {
  return (
    <>
      <h1 className="content-h1">{title}</h1>
      {renderMarkdown(content)}
    </>
  );
}
