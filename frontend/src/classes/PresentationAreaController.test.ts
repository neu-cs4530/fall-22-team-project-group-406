import { mock, mockClear } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { PlayerLocation } from '../types/CoveyTownSocket';
import PresentationAreaController, { PresentationAreaEvents } from './PresentationAreaController';
import PlayerController from './PlayerController';

describe('DocumentAreaController', () => {
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
    mockClear(mockListeners.changeSlide);
    mockClear(mockListeners.occupantsChange);
    testArea.addListener('changeSlide', mockListeners.changeSlide);
    testArea.addListener('occupantsChange', mockListeners.occupantsChange);
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
      expect(mockListeners.changeSlide).not.toBeCalled();
    });
    it('emits the changeSlide event when setting the property and updates the model', () => {
      const newSlide = testArea.slide + 1;
      testArea.slide = newSlide;
      expect(testArea.slide).toEqual(newSlide);
      expect(mockListeners.changeSlide).toBeCalledWith(newSlide);
      expect(testArea.toPresentationAreaModel()).toEqual({
        id: testArea.id,
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
      expect(mockListeners.changeSlide).not.toBeCalled();
    });
    it('emits the changeSlide event when setting the property and updates the model', () => {
      const newSlide = testArea.slide + 1;
      testArea.slide = newSlide;
      expect(testArea.slide).toEqual(newSlide);
      expect(mockListeners.changeSlide).toBeCalledWith(newSlide);
      const newDocument = nanoid();
      testArea.document = newDocument;
      expect(testArea.document).toEqual(newDocument);
      expect(mockListeners.changeSlide).toBeCalledWith(0);
      expect(testArea.toPresentationAreaModel()).toEqual({
        id: testArea.id,
        occupantsByID: testArea.occupants.map(eachOccupant => eachOccupant.id),
        document: testArea.document,
        slide: testArea.slide,
      });
    });
    it('does not emit the changeSlide event when the slide is already 0', () => {
      const newDocument = nanoid();
      testArea.document = newDocument;
      expect(testArea.document).toEqual(newDocument);
      expect(mockListeners.changeSlide).not.toBeCalled();
      expect(testArea.toPresentationAreaModel()).toEqual({
        id: testArea.id,
        occupantsByID: testArea.occupants.map(eachOccupant => eachOccupant.id),
        document: testArea.document,
        slide: testArea.slide,
      });
    });
    it('does not emit the changeSlide event when setting the property to the same document', () => {
      const newSlide = testArea.slide + 1;
      testArea.slide = newSlide;
      expect(testArea.slide).toEqual(newSlide);
      expect(mockListeners.changeSlide).toBeCalledWith(newSlide);
      const newDocument = testArea.document;
      testArea.document = newDocument;
      expect(mockListeners.changeSlide).toBeCalledTimes(1);
      expect(testArea.toPresentationAreaModel()).toEqual({
        id: testArea.id,
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
        occupantsByID: testArea.occupants.map(eachOccupant => eachOccupant.id),
        document: testArea.document,
        slide: testArea.slide,
      });
    });
  });
});
