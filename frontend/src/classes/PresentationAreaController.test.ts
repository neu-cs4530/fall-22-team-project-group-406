import { mock, mockClear } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { PlayerLocation } from '../types/CoveyTownSocket';
import PresentationAreaController, { PresentationAreaEvents } from './PresentationAreaController';
import PlayerController from './PlayerController';

describe('PresentationAreaController', () => {
  let testArea: PresentationAreaController;
  const mockListeners = mock<PresentationAreaEvents>();
  beforeEach(() => {
    const playerLocation: PlayerLocation = {
      moving: false,
      x: 0,
      y: 0,
      rotation: 'front',
    };
    testArea = new PresentationAreaController(nanoid(), nanoid());
    testArea.occupants = [
      new PlayerController(nanoid(), nanoid(), playerLocation),
      new PlayerController(nanoid(), nanoid(), playerLocation),
      new PlayerController(nanoid(), nanoid(), playerLocation),
    ];
    testArea.numSlides = 5;
    mockClear(mockListeners.slideChange);
    mockClear(mockListeners.occupantsChange);
    mockClear(mockListeners.documentChange);
    testArea.addListener('slideChange', mockListeners.slideChange);
    testArea.addListener('occupantsChange', mockListeners.occupantsChange);
    testArea.addListener('documentChange', mockListeners.documentChange);
  });
  describe('Setting the occupants property', () => {
    it('does not update the property if the new occupants are the same set as the old', () => {
      const origOccupants = testArea.occupants;
      const occupantsCopy = testArea.occupants.concat([]);
      const shuffledOccupants = occupantsCopy.reverse();
      testArea.occupants = shuffledOccupants;
      expect(testArea.occupants).toEqual(origOccupants);
      expect(mockListeners.occupantsChange).not.toBeCalled();
    });
    it('emits the occupantsChange event when setting the property and updates the model', () => {
      const newOccupants = testArea.occupants.slice(1);
      testArea.occupants = newOccupants;
      expect(testArea.occupants).toEqual(newOccupants);
      expect(mockListeners.occupantsChange).toBeCalledWith(newOccupants);
      expect(testArea.toPresentationAreaModel()).toEqual({
        id: testArea.id,
        numSlides: testArea.numSlides,
        occupantsByID: testArea.occupants.map(eachOccupant => eachOccupant.id),
        document: testArea.document,
        slide: testArea.slide,
      });
    });
  });
  describe('Setting the slide property', () => {
    it('does not update the property if the new slide is the same as the old', () => {
      const origSlide = testArea.slide;
      testArea.slide = origSlide;
      expect(testArea.slide).toEqual(origSlide);
      expect(mockListeners.slideChange).not.toBeCalled();
    });
    it('emits the changeSlide event when setting the property and updates the model', () => {
      const newSlide = testArea.slide + 1;
      testArea.slide = newSlide;
      expect(testArea.slide).toEqual(newSlide);
      expect(mockListeners.slideChange).toBeCalledWith(newSlide);
      expect(testArea.toPresentationAreaModel()).toEqual({
        id: testArea.id,
        numSlides: testArea.numSlides,
        occupantsByID: testArea.occupants.map(eachOccupant => eachOccupant.id),
        document: testArea.document,
        slide: testArea.slide,
      });
    });
    it('does not emit the changeSlide event when the slide is already 0', () => {
      const newDocument = nanoid();
      testArea.document = newDocument;
      expect(testArea.document).toEqual(newDocument);
      expect(mockListeners.slideChange).not.toBeCalled();
      expect(testArea.toPresentationAreaModel()).toEqual({
        id: testArea.id,
        numSlides: testArea.numSlides,
        occupantsByID: testArea.occupants.map(eachOccupant => eachOccupant.id),
        document: testArea.document,
        slide: testArea.slide,
      });
    });
    it('does not change the slide when set to a number greater than the number of slides', () => {
      const newSlide = 6;
      testArea.slide = newSlide;
      expect(testArea.slide).toEqual(0);
      expect(mockListeners.slideChange).not.toBeCalled();
      expect(testArea.toPresentationAreaModel()).toEqual({
        id: testArea.id,
        numSlides: testArea.numSlides,
        occupantsByID: testArea.occupants.map(eachOccupant => eachOccupant.id),
        document: testArea.document,
        slide: testArea.slide,
      });
    });
    it('does not change the slide when setting the property to a negative number', () => {
      const newSlide = -1;
      testArea.slide = newSlide;
      expect(testArea.slide).toEqual(0);
      expect(mockListeners.slideChange).not.toBeCalled();
      expect(testArea.toPresentationAreaModel()).toEqual({
        id: testArea.id,
        numSlides: testArea.numSlides,
        occupantsByID: testArea.occupants.map(eachOccupant => eachOccupant.id),
        document: testArea.document,
        slide: testArea.slide,
      });
    });
  });
  describe('Setting the document property', () => {
    it('does not update the property if the new document is the same as the old', () => {
      const origDocument = testArea.document;
      testArea.document = origDocument;
      expect(testArea.document).toEqual(origDocument);
      expect(mockListeners.slideChange).not.toBeCalled();
    });
    it('updates the property and emits documentChange event if the property changes', () => {
      const newDocument = nanoid();
      testArea.document = newDocument;
      expect(mockListeners.documentChange).toBeCalledWith(newDocument);
      expect(testArea.document).toEqual(newDocument);
    });
    it('emits the changeSlide event when setting the property and updates the model', () => {
      const newSlide = testArea.slide + 1;
      testArea.slide = newSlide;
      expect(testArea.slide).toEqual(newSlide);
      expect(mockListeners.slideChange).toBeCalledWith(newSlide);
      const newDocument = nanoid();
      testArea.document = newDocument;
      expect(testArea.document).toEqual(newDocument);
      expect(mockListeners.slideChange).toBeCalledWith(0);
      expect(testArea.toPresentationAreaModel()).toEqual({
        id: testArea.id,
        numSlides: testArea.numSlides,
        occupantsByID: testArea.occupants.map(eachOccupant => eachOccupant.id),
        document: testArea.document,
        slide: testArea.slide,
      });
    });
    it('does not emit the changeSlide event when setting the property to the same document', () => {
      const newSlide = testArea.slide + 1;
      testArea.slide = newSlide;
      expect(testArea.slide).toEqual(newSlide);
      expect(mockListeners.slideChange).toBeCalledWith(newSlide);
      const newDocument = testArea.document;
      testArea.document = newDocument;
      expect(mockListeners.slideChange).toBeCalledTimes(1);
      expect(testArea.toPresentationAreaModel()).toEqual({
        id: testArea.id,
        numSlides: testArea.numSlides,
        occupantsByID: testArea.occupants.map(eachOccupant => eachOccupant.id),
        document: testArea.document,
        slide: testArea.slide,
      });
    });
  });
  describe('toPresentationAreaModel', () => {
    it('returns the correct model', () => {
      expect(testArea.toPresentationAreaModel()).toEqual({
        id: testArea.id,
        numSlides: testArea.numSlides,
        occupantsByID: testArea.occupants.map(eachOccupant => eachOccupant.id),
        document: testArea.document,
        slide: testArea.slide,
      });
    });
  });
});
