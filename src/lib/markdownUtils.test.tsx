import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { parseMarkdown, SmartText, hasMarkdownFormatting } from './markdownUtils';

describe('hasMarkdownFormatting', () => {
  it('returns false for plain text', () => {
    expect(hasMarkdownFormatting('Hello world')).toBe(false);
  });

  it('returns true for bold text', () => {
    expect(hasMarkdownFormatting('Hello **bold** world')).toBe(true);
  });

  it('returns true for bullet lists', () => {
    expect(hasMarkdownFormatting('- Item 1\n- Item 2')).toBe(true);
  });

  it('returns true for headers', () => {
    expect(hasMarkdownFormatting('# Header')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(hasMarkdownFormatting('')).toBe(false);
  });
});

describe('parseMarkdown', () => {
  it('renders plain text', () => {
    const { container } = render(<>{parseMarkdown('Hello world')}</>);
    expect(container.textContent).toContain('Hello world');
  });

  it('renders bold text with correct class', () => {
    render(<>{parseMarkdown('Hello **bold** world')}</>);
    const boldElement = screen.getByText('bold');
    expect(boldElement.tagName).toBe('STRONG');
    expect(boldElement).toHaveClass('font-semibold');
  });

  it('renders inline code with correct styling', () => {
    render(<>{parseMarkdown('Use `console.log()` here')}</>);
    const codeElement = screen.getByText('console.log()');
    expect(codeElement.tagName).toBe('CODE');
    expect(codeElement).toHaveClass('bg-muted');
  });

  it('renders headers', () => {
    render(<>{parseMarkdown('# Main Header')}</>);
    expect(screen.getByText('Main Header')).toBeInTheDocument();
  });

  it('renders bullet lists', () => {
    render(<>{parseMarkdown('- Item 1\n- Item 2\n- Item 3')}</>);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('handles empty string', () => {
    const { container } = render(<>{parseMarkdown('')}</>);
    expect(container.querySelector('span')).toBeInTheDocument();
  });

  it('handles undefined gracefully', () => {
    const { container } = render(<>{parseMarkdown(undefined as unknown as string)}</>);
    expect(container.querySelector('span')).toBeInTheDocument();
  });
});

describe('SmartText', () => {
  it('renders content text', () => {
    render(<SmartText content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<SmartText content="Test" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders markdown in content', () => {
    render(<SmartText content="This is **bold** text" />);
    expect(screen.getByText('bold')).toHaveClass('font-semibold');
  });

  it('handles multiline markdown', () => {
    render(
      <SmartText content={`# Header

Some paragraph text.

- List item 1
- List item 2`} />
    );
    
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText(/Some paragraph text/)).toBeInTheDocument();
    expect(screen.getByText('List item 1')).toBeInTheDocument();
  });

  it('respects forcePlain option', () => {
    render(<SmartText content="**not bold**" forcePlain />);
    // When forcePlain, the asterisks should be visible as text
    expect(screen.getByText('**not bold**')).toBeInTheDocument();
  });

  it('renders plain text without markdown wrapper', () => {
    render(<SmartText content="Just plain text" />);
    expect(screen.getByText('Just plain text').tagName).toBe('SPAN');
  });

  it('handles empty content', () => {
    const { container } = render(<SmartText content="" />);
    expect(container.querySelector('span')).toBeInTheDocument();
  });
});
