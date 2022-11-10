import { ConversationArea, Interactable, PresentationArea, ViewingArea } from './CoveyTownSocket';

/**
 * Test to see if an interactable is a conversation area
 */
export function isConversationArea(interactable: Interactable): interactable is ConversationArea {
  return 'topic' in interactable;
}

/**
 * Test to see if an interactable is a viewing area
 */
export function isViewingArea(interactable: Interactable): interactable is ViewingArea {
  return 'isPlaying' in interactable;
}

/**
 * Test to see if an interactable is a presentation area
 */
export function isPresentationArea(interactable: Interactable): interactable is PresentationArea {
  return 'document' in interactable;
}
