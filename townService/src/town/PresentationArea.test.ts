import { mock, mockClear } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import Player from '../lib/Player';
import { getLastEmittedEvent } from '../TestUtils';
import { TownEmitter } from '../types/CoveyTownSocket';
import PresentationArea from './PresentationArea';

describe('PresentationArea', () => {
  const testAreaBox = { x: 100, y: 100, width: 100, height: 100 };
  let testArea: PresentationArea;
  const townEmitter = mock<TownEmitter>();
  const document = nanoid();
  const numSlides = 5;
  const slide = 0;
  const id = nanoid();
  let newPlayer: Player;

  beforeEach(() => {
    mockClear(townEmitter);
    testArea = new PresentationArea(
      { document, slide, numSlides, id, occupantsByID: [] },
      testAreaBox,
      townEmitter,
    );
    newPlayer = new Player(nanoid(), mock<TownEmitter>());
    testArea.add(newPlayer);
  });

  describe('isActive', () => {
    it('returns true when the area is active', () => {
      expect(testArea.isActive).toBe(true);
    });
    it('returns false when the area is not active', () => {
      testArea.remove(newPlayer);
      expect(testArea.isActive).toBe(false);
    });
  });
  describe('add', () => {
    it('Adds the player to the occupants list and emits an interactableUpdate event', () => {
      expect(testArea.occupantsByID).toEqual([newPlayer.id]);

      const lastEmittedUpdate = getLastEmittedEvent(townEmitter, 'interactableUpdate');
      expect(lastEmittedUpdate).toEqual({
        document,
        slide,
        id,
        numSlides,
        occupantsByID: [newPlayer.id],
      });
    });
    it("Sets the player's presentation and emits an update for their location", () => {
      expect(newPlayer.location.interactableID).toEqual(id);

      const lastEmittedMovement = getLastEmittedEvent(townEmitter, 'playerMoved');
      expect(lastEmittedMovement.location.interactableID).toEqual(id);
    });
  });
  describe('updateModel', () => {
    test('updateModel sets video, isPlaying and elapsedTimeSec', () => {
      testArea.updateModel({
        id: 'ignore',
        numSlides: 10,
        slide: 3,
        occupantsByID: [],
        document: 'test-document',
        title: 'test-title',
      });
      expect(testArea.id).toBe(id);
      expect(testArea.numSlides).toBe(10);
      expect(testArea.slide).toBe(3);
      expect(testArea.occupantsByID).toEqual([newPlayer.id]);
      expect(testArea.document).toBe('test-document');
      expect(testArea.title).toBe('test-title');
    });
  });
  describe('fromMapObject', () => {
    it('Throws an error if the width or height are missing', () => {
      expect(() =>
        PresentationArea.fromMapObject(
          { id: 1, name: nanoid(), visible: true, x: 0, y: 0 },
          townEmitter,
        ),
      ).toThrowError();
    });
    it('Creates a new conversation area using the provided boundingBox and id, with an empty occupants list', () => {
      const x = 30;
      const y = 20;
      const width = 10;
      const height = 20;
      const name = 'name';
      const val = PresentationArea.fromMapObject(
        { x, y, width, height, name, id: 10, visible: true },
        townEmitter,
      );
      expect(val.boundingBox).toEqual({ x, y, width, height });
      expect(val.id).toEqual(name);
      expect(val.numSlides).toEqual(0);
      expect(val.slide).toEqual(0);
      expect(val.document).toBeUndefined();
      expect(val.title).toBeUndefined();
      expect(val.occupantsByID).toEqual([]);
    });
  });
});
