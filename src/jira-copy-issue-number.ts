(function () {
  'use strict';

  const copyButtonWrapperTestId =
    'issue.common.component.permalink-button.button.copy-link-button-wrapper';
  const copyIconTestId =
    'issue.common.component.permalink-button.button.link-icon';
  const currentIssueTestId =
    'issue.views.issue-base.foundation.breadcrumbs.current-issue.item';

  let isOptionPressed = false;

  function handleOptionKey(event: KeyboardEvent) {
    // do not fire multiple times if key is held down
    if (event.repeat) return;

    // determine if Alt (Option) key is pressed or released
    if (event.type === 'keydown') {
      isOptionPressed = event.key === 'Alt';
    } else {
      isOptionPressed = false;
    }

    // update all copy buttons
    handleCopyButtons();
  }

  function createIssueIcon(): SVGElement | undefined {
    const template = document.createElement('template');
    template.innerHTML = `
<svg fill="none" viewBox="0 0 24 24" role="presentation">
  <path
    clip-rule="evenodd"
    fill="currentcolor"
    fill-rule="evenodd"
    d="M11.53,2a4.37,4.37,0,0,0,4.35,4.35h1.78v1.7A4.35,4.35,0,0,0,22,12.4V2.84A.85.85,0,0,0,21.16,2H11.53M6.77,6.8a4.36,4.36,0,0,0,4.34,4.34h1.8v1.72a4.36,4.36,0,0,0,4.34,4.34V7.63a.84.84,0,0,0-.83-.83H6.77M2,11.6a4.34,4.34,0,0,0,4.35,4.34H8.13v1.72A4.36,4.36,0,0,0,12.47,22V12.43a.85.85,0,0,0-.84-.84H2Z"
  ></path>
</svg>
    `;
    return (template.content.firstElementChild as SVGElement) ?? undefined;
  }

  function handleCopyButton(wrapper: HTMLElement) {
    const button = wrapper.querySelector('button') ?? undefined;
    const icons =
      button?.querySelector<HTMLElement>(`[data-testid="${copyIconTestId}"]`) ??
      undefined;
    const iconLink =
      icons?.querySelector<SVGElement>('svg:not(.issue-icon)') ?? undefined;
    let iconIssue =
      icons?.querySelector<SVGElement>('svg.issue-icon') ?? undefined;

    // add issue icon
    iconIssue?.remove();
    iconIssue = createIssueIcon();
    iconIssue?.setAttribute('class', iconLink?.getAttribute('class') ?? '');
    iconIssue?.classList.add('issue-icon');
    icons?.appendChild(iconIssue as Node);

    // toggle icons based on Option key state
    if (isOptionPressed) {
      iconLink?.style?.setProperty('display', 'none');
      iconIssue?.style?.setProperty('display', 'block');
    } else {
      iconLink?.style?.setProperty('display', 'block');
      iconIssue?.style?.setProperty('display', 'none');
    }
  }

  function handleCopyButtons() {
    document
      .querySelectorAll<HTMLElement>(
        `[data-testid="${copyButtonWrapperTestId}"]`,
      )
      .forEach(handleCopyButton);
  }

  type InterceptedClickEvent = MouseEvent & { _copyIssueInstead?: boolean };

  // Check when bubbling up, if the click originated from
  // a copy button
  function handleGlobalClickUp(event: InterceptedClickEvent) {
    const wrapper = (event.target as HTMLElement).closest(
      `[data-testid="${copyButtonWrapperTestId}"]`,
    );
    if (!wrapper) return;

    // set a flag on the event to indicate we want to copy
    // the issue key instead of the link
    event._copyIssueInstead = isOptionPressed;
  }

  // Check when capturing down, if the flag is set to copy
  // the issue key, and if so, write it to the clipboard
  function handleGlobalClickDown(event: InterceptedClickEvent) {
    if (event._copyIssueInstead) {
      const issue = document
        .querySelector(`[data-testid="${currentIssueTestId}"]`)
        ?.textContent?.trim();
      navigator.clipboard.writeText(issue ?? '');
    }
  }

  // Observe tooltips and align contents when option key is pressed
  function handleTooltipChanges() {
    const defaultText = 'Copy link';
    const issueText = 'Copy issue key';
    const useTooltip = isOptionPressed ? issueText : defaultText;
    [
      ...document.querySelectorAll(
        '.atlaskit-portal-container span[aria-live="assertive"]',
      ),
    ]
      .filter((node) =>
        [defaultText, issueText].includes(node.textContent.trim() ?? ''),
      )
      .filter((tooltip) => tooltip.textContent !== useTooltip)
      .map((tooltip) => (tooltip.textContent = useTooltip));
  }

  // handle user inputs to intercept copy button
  window.addEventListener('keydown', handleOptionKey, false);
  window.addEventListener('keyup', handleOptionKey, false);
  window.addEventListener('click', handleGlobalClickUp, true);
  window.addEventListener('click', handleGlobalClickDown, false);

  // check dom mutations to update tooltip text accordingly
  new MutationObserver(handleTooltipChanges).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: false,
  });
})();
