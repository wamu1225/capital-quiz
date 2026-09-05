// 最小限のmarkdown風レンダラ。## 見出しと段落だけを扱う（このサイトの静的ページには十分）。
import type { JSX } from 'react';

export function renderMarkdown(text: string): JSX.Element[] {
  const blocks = text.trim().split(/\n\n+/);
  return blocks.map((block, i) => {
    if (block.startsWith('## ')) {
      return (
        <h2 className="content-h2" key={i}>
          {block.slice(3).trim()}
        </h2>
      );
    }
    return (
      <p className="content-p" key={i}>
        {block}
      </p>
    );
  });
}
