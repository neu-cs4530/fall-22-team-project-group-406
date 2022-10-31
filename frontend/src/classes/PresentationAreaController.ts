import EventEmitter from 'events';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import TypedEmitter from 'typed-emitter';
import { PresentationArea as PresentationAreaModel } from '../types/CoveyTownSocket';
import PlayerController from './PlayerController';

export type PresentationAreaEvents = {
  changeDocument: (newDocument: string | undefined) => void;
  changeSlide: (newSlide: number) => void;
  occupantsChange: (newOccupants: PlayerController[]) => void;
};

export default class PresentationAreaController extends (EventEmitter as new () => TypedEmitter<PresentationAreaEvents>) {
  private _occupants: PlayerController[] = [];

  private readonly _id: string;

  private _document: string | undefined;

  private _slide = 0;

  constructor(id: string, document?: string) {
    super();
    this._id = id;
    this._document = document;
  }

  /**
   * Returns the ID of this presentation area (read only)
   */
  get id() {
    return this._id;
  }

  /**
   * Sets the occupants for this presentation area. Emits an occupantsChange event if the occupants change.
   */
  set occupants(newOccupants: PlayerController[]) {
    if (
      newOccupants.length !== this._occupants.length ||
      _.xor(newOccupants, this._occupants).length > 0
    ) {
      this.emit('occupantsChange', newOccupants);
      this._occupants = newOccupants;
    }
  }

  /**
   * Returns the current occupants for this presentation area.
   */
  get occupants() {
    return this._occupants;
  }

  /**
   * Sets the document for this presentation area. Changes the slide to 0 and emits a changeDocument event if the document changes.
   */
  set document(newDocument: string | undefined) {
    if (this._document !== newDocument) {
      this.emit('changeDocument', newDocument);
      this.slide = 0;
    }
    this._document = newDocument;
  }

  /**
   * Returns the current document for this presentation area.
   */
  get document(): string | undefined {
    return this._document;
  }

  /**
   * Sets the slide for this presentation area. Emits a changeSlide event if the slide changes.
   */
  set slide(newSlide: number) {
    if (this._slide !== newSlide) {
      this.emit('changeSlide', newSlide);
    }
    this._slide = newSlide;
  }

  /**
   * Returns the current slide for this presentation area.
   */
  get slide(): number {
    return this._slide;
  }

  /**
   * @returns a PresentationAreaModel for this presentation area.
   */
  toPresentationAreaModel(): PresentationAreaModel {
    return {
      id: this.id,
      occupantsByID: this._occupants.map(o => o.id),
      document: this.document,
      slide: this.slide,
    };
  }

  /**
   * @param model a PresentationAreaModel to create a PresentationAreaController from.
   * @param playerFinder a function that takes a player ID and returns the PlayerController for that player.
   * @returns a new PresentationAreaController.
   */
  static fromPresentationAreaModel(
    model: PresentationAreaModel,
    playerFinder: (playerIDs: string[]) => PlayerController[],
  ): PresentationAreaController {
    const area = new PresentationAreaController(model.id, model.document);
    area.slide = model.slide;
    area.occupants = playerFinder(model.occupantsByID);
    return area;
  }
}

export function usePresentationAreaOccupants(area: PresentationAreaController): PlayerController[] {
  const [occupants, setOccupants] = useState(area.occupants);
  useEffect(() => {
    area.addListener('occupantsChange', setOccupants);
    return () => {
      area.removeListener('occupantsChange', setOccupants);
    };
  }, [area]);
  return occupants;
}

export function usePresentationAreaSlide(area: PresentationAreaController): number {
  const [slide, setSlide] = useState(area.slide);
  useEffect(() => {
    area.addListener('changeSlide', setSlide);
    return () => {
      area.removeListener('changeSlide', setSlide);
    };
  }, [area]);
  return slide;
}

export function usePresentationAreaDocument(area: PresentationAreaController): string | undefined {
  const [document, setDocument] = useState(area.document);
  useEffect(() => {
    area.addListener('changeDocument', setDocument);
    return () => {
      area.removeListener('changeDocument', setDocument);
    };
  }, [area]);
  return document;
}
