import { css } from 'lit';

export const featureTreeStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  :host {
    --mst-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
      'Helvetica Neue', Arial, sans-serif;
    --mst-bg: rgba(255, 255, 255, 0.8);
    --mst-border: #e8e8e8;
    --mst-text: rgba(0, 0, 0, 0.85);
    --mst-text-muted: #bfbfbf;
    --mst-text-secondary: #666;
    --mst-primary: #1677ff;
    --mst-primary-hover: #f5faff;
    --mst-primary-selected: #e6f4ff;
    --mst-match: #f50;
    --mst-match-muted: #8c8c8c;
    --mst-line: #d9d9d9;
    --mst-row-height: 40px;
    --mst-indent: 24px;

    display: block;
    font-family: var(--mst-font);
    width: 500px;
    background-color: var(--mst-bg);
    overflow: hidden;
    color: var(--mst-text);
  }

  .search-wrap {
    padding: 12px 10px;
  }

  .search-input {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: 32px;
    padding: 0 11px;
    background: #fff;
    border: 1px solid var(--mst-line);
    border-radius: 6px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .search-input:focus-within {
    border-color: var(--mst-primary);
    box-shadow: 0 0 0 2px rgba(5, 145, 255, 0.1);
  }
  .search-input > .icon {
    color: rgba(0, 0, 0, 0.25);
    margin-right: 8px;
    font-size: 14px;
    display: inline-flex;
  }
  .search-input > input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font: inherit;
    color: inherit;
    min-width: 0;
  }

  .tree-scroll {
    height: calc(100% - 56px);
    max-height: 750px;
    overflow: auto;
    padding: 0 10px 8px;
  }

  ul.tree-list,
  ul.tree-list ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .row {
    display: flex;
    align-items: center;
    height: var(--mst-row-height);
    padding: 0 4px;
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;
    position: relative;
  }
  .row:hover {
    background-color: var(--mst-primary-hover);
  }
  .row[aria-selected='true'] {
    background-color: var(--mst-primary-selected);
  }

  /* Dashed vertical guide lines for each indentation level, mimicking antd showLine. */
  .indent {
    flex: none;
    width: var(--mst-indent);
    height: 100%;
    position: relative;
  }
  .indent::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    border-left: 1px dashed var(--mst-line);
  }

  .switcher {
    flex: none;
    width: var(--mst-indent);
    height: var(--mst-indent);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--mst-text-secondary);
    transition: transform 0.2s;
    font-size: 12px;
  }
  .switcher.expanded {
    transform: rotate(90deg);
  }
  .switcher.leaf {
    color: var(--mst-line);
  }

  .row-body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 0;
    padding: 0 4px;
  }
  .title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .title.hidden {
    color: var(--mst-text-muted);
  }
  .title .match {
    color: var(--mst-match);
  }
  .title.hidden .match {
    color: var(--mst-match-muted);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    margin-left: 8px;
  }
  .action-btn {
    width: 20px;
    height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--mst-text-secondary);
    cursor: pointer;
    border: none;
    background: transparent;
    padding: 0;
    border-radius: 2px;
    font-size: 14px;
  }
  .action-btn:hover {
    color: var(--mst-primary);
    background: rgba(0, 0, 0, 0.04);
  }
  .action-btn.muted {
    color: var(--mst-text-muted);
  }

  .dropdown {
    position: fixed;
    z-index: 1000;
    min-width: 120px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08),
      0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
    padding: 4px 0;
    font-size: 14px;
  }
  .dropdown-item {
    padding: 5px 12px;
    cursor: pointer;
    color: var(--mst-text);
  }
  .dropdown-item:hover {
    background: var(--mst-primary-hover);
    color: var(--mst-primary);
  }

  .empty {
    padding: 24px;
    color: var(--mst-text-muted);
    text-align: center;
  }
`;
