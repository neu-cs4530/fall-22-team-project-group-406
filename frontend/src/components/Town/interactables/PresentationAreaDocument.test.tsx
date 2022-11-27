import { ChakraProvider } from '@chakra-ui/react';
import { EventNames } from '@socket.io/component-emitter';
import { cleanup, render, RenderResult } from '@testing-library/react';
import { mock, MockProxy } from 'jest-mock-extended';
import React from 'react';
import { act } from 'react-dom/test-utils';
import TownController from '../../../classes/TownController';
import PresentationAreaController, {
  PresentationAreaEvents,
} from '../../../classes/PresentationAreaController';
import TownControllerContext from '../../../contexts/TownControllerContext';
import { PresentationAreaDocument } from './PresentationAreaDocument';
import { nanoid } from 'nanoid';

function renderPresentationArea(
  presentationArea: PresentationAreaController,
  controller: TownController,
) {
  return (
    <ChakraProvider>
      <TownControllerContext.Provider value={controller}>
        <PresentationAreaDocument controller={presentationArea} initialDocument={nanoid()} />
      </TownControllerContext.Provider>
    </ChakraProvider>
  );
}

describe('Presentation Area Document', () => {
  let presentationArea: PresentationAreaController;
  type PresentationAreaEventName = keyof PresentationAreaEvents;
  let addListenerSpy: jest.SpyInstance<
    PresentationAreaController,
    [event: PresentationAreaEventName, listener: PresentationAreaEvents[PresentationAreaEventName]]
  >;

  let removeListenerSpy: jest.SpyInstance<
    PresentationAreaController,
    [event: PresentationAreaEventName, listener: PresentationAreaEvents[PresentationAreaEventName]]
  >;

  let townController: MockProxy<TownController>;

  let renderData: RenderResult;
  beforeEach(() => {
    townController = mock<TownController>();
    presentationArea = new PresentationAreaController('test', nanoid(), 0, 10, 'test.pdf');

    addListenerSpy = jest.spyOn(presentationArea, 'addListener');
    removeListenerSpy = jest.spyOn(presentationArea, 'removeListener');

    renderData = render(renderPresentationArea(presentationArea, townController));
  });
  /**
   * Retrieve the listener passed to "addListener" for a given eventName
   * @throws Error if the addListener method was not invoked exactly once for the given eventName
   */
  function getSingleListenerAdded<Ev extends EventNames<PresentationAreaEvents>>(
    eventName: Ev,
    spy = addListenerSpy,
  ): PresentationAreaEvents[Ev] {
    const addedListeners = spy.mock.calls.filter(eachCall => eachCall[0] === eventName);
    if (addedListeners.length !== 1) {
      throw new Error(
        `Expected to find exactly one addListener call for ${eventName} but found ${addedListeners.length}`,
      );
    }
    return addedListeners[0][1] as unknown as PresentationAreaEvents[Ev];
  }
  /**
   * Retrieve the listener pased to "removeListener" for a given eventName
   * @throws Error if the removeListener method was not invoked exactly once for the given eventName
   */
  function getSingleListenerRemoved<Ev extends EventNames<PresentationAreaEvents>>(
    eventName: Ev,
  ): PresentationAreaEvents[Ev] {
    const removedListeners = removeListenerSpy.mock.calls.filter(
      eachCall => eachCall[0] === eventName,
    );
    if (removedListeners.length !== 1) {
      throw new Error(
        `Expected to find exactly one removeListeners call for ${eventName} but found ${removedListeners.length}`,
      );
    }
    return removedListeners[0][1] as unknown as PresentationAreaEvents[Ev];
  }
  describe('[T4] Bridging events from the PresentationAreaController to the ReactPlayer', () => {
    describe('Registering PresentationAreaController listeners', () => {
      describe('When rendered', () => {
        it('Registers exactly one documentChange listener', () => {
          act(() => {
            presentationArea.emit('documentChange', nanoid());
          });
          act(() => {
            presentationArea.emit('documentChange', nanoid());
          });
          getSingleListenerAdded('documentChange');
        });
        it('Removes the documentChange listener at unmount', () => {
          act(() => {
            presentationArea.emit('documentChange', nanoid());
          });
          const listenerAdded = getSingleListenerAdded('documentChange');
          cleanup();
          expect(getSingleListenerRemoved('documentChange')).toBe(listenerAdded);
        });
        it('Registers exactly one slideChange listener', () => {
          act(() => {
            presentationArea.emit('slideChange', 2);
          });
          act(() => {
            presentationArea.emit('slideChange', 3);
          });
          act(() => {
            presentationArea.emit('slideChange', 4);
          });
          act(() => {
            presentationArea.emit('slideChange', 5);
          });
          getSingleListenerAdded('slideChange');
        });
        it('Removes the slideChange listener at unmount', () => {
          act(() => {
            presentationArea.emit('slideChange', 3);
          });
          const listenerAdded = getSingleListenerAdded('slideChange');
          cleanup();
          expect(getSingleListenerRemoved('slideChange')).toBe(listenerAdded);
        });
      });
      describe('When re-rendered with a different presentation area controller', () => {
        it('Removes the listeners on the old presentation area controller and adds listeners to the new controller', () => {
          const origPlayback = getSingleListenerAdded('documentChange');
          const origProgress = getSingleListenerAdded('slideChange');

          const newPresentationArea = new PresentationAreaController(
            'test2',
            nanoid(),
            1,
            11,
            'test2.pdf',
          );
          const newAddListenerSpy = jest.spyOn(newPresentationArea, 'addListener');
          renderData.rerender(renderPresentationArea(newPresentationArea, townController));

          expect(getSingleListenerRemoved('documentChange')).toBe(origPlayback);
          expect(getSingleListenerRemoved('slideChange')).toBe(origProgress);

          getSingleListenerAdded('documentChange', newAddListenerSpy);
          getSingleListenerAdded('slideChange', newAddListenerSpy);
        });
      });
    });
  });
});
