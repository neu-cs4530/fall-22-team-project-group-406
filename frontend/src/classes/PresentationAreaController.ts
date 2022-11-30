import EventEmitter from 'events';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import TypedEmitter from 'typed-emitter';
import { PresentationArea as PresentationAreaModel } from '../types/CoveyTownSocket';
import PlayerController from './PlayerController';

export type PresentationAreaEvents = {
  documentChange: (newDocument: string | undefined) => void;
  slideChange: (newSlide: number) => void;
  numSlidesChange: (newNumSlides: number) => void;
  titleChange: (newTitle: string | undefined) => void;
  occupantsChange: (newOccupants: PlayerController[]) => void;
};

// The special string that will be displayed when a presentaion area does not have a title set
export const NO_TITLE_STRING = '(No title)';
export default class PresentationAreaController extends (EventEmitter as new () => TypedEmitter<PresentationAreaEvents>) {
  private _occupants: PlayerController[] = [];

  private readonly _id: string;

  private _document: string | undefined;

  private _slide: number;

  private _numSlides: number;

  private _title?: string;

  private _presenter: PlayerController | undefined;

  constructor(
    id: string,
    document?: string,
    slide = 0,
    numSlides = 0,
    title?: string,
    presenter?: PlayerController,
  ) {
    super();
    this._id = id;
    this._document = document;
    this._slide = slide;
    this._numSlides = numSlides;
    this._title = title;
    this._presenter = presenter;
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
   * Sets the document for this presentation area. Changes the slide to 0 and emits a documentChange event if the document changes.
   */
  set document(newDocument: string | undefined) {
    if (this._document !== newDocument) {
      this.emit('documentChange', newDocument);
      this.slide = 0;
      this._document = newDocument;
    }
  }

  /**
   * Returns the current document for this presentation area.
   */
  get document(): string | undefined {
    return this._document;
  }

  /**
   * Sets the number of slides for this presentation area.
   */
  set numSlides(newNumSlides: number) {
    if (this._numSlides !== newNumSlides) {
      this.emit('numSlidesChange', newNumSlides);
      this._numSlides = newNumSlides;
    }
  }

  /**
   * Returns the number of slides for this presentation area.
   */
  get numSlides(): number {
    return this._numSlides;
  }

  /**
   * Sets the current slide for this presentation area. Emits a slideChange event if the slide changes.
   */
  set slide(newSlide: number) {
    if (this._slide !== newSlide && newSlide >= 0 && newSlide < this._numSlides) {
      this.emit('slideChange', newSlide);
      this._slide = newSlide;
    }
  }

  /**
   * Returns the current slide for this presentation area.
   */
  get slide(): number {
    return this._slide;
  }

  /**
   * Sets the presenter for this presentation area.
   */
  set presenter(newPresenter: PlayerController | undefined) {
    if (
      (this._presenter === undefined && newPresenter !== undefined) ||
      (this._presenter !== undefined && newPresenter === undefined)
    ) {
      this._presenter = newPresenter;
    }
  }

  /**
   * Returns the presenter for this presentation area.
   */
  get presenter(): PlayerController | undefined {
    return this._presenter;
  }

  /**
   * The title of the presentation area. Changing the title will emit a titleChange event
   *
   * Setting the title to the value `undefined` will indicate that the presentation area is not active
   */
  set title(newTitle: string | undefined) {
    if (this._title !== newTitle) {
      this.emit('titleChange', newTitle);
      this._title = newTitle;
    }
  }

  /**
   * Returns the title of the presentation area.
   */
  get title(): string | undefined {
    return this._title;
  }

  /**
   * A presentation area is empty if there are no occupants in it, the title is undefined, or
   * the document is undefined.
   */
  isEmpty(): boolean {
    return (
      this._title === undefined || this._occupants.length === 0 || this._document === undefined
    );
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
      numSlides: this.numSlides,
      title: this.title,
      presenterID: this.presenter ? this.presenter.id : undefined,
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
    const area = new PresentationAreaController(
      model.id,
      model.document,
      model.slide,
      model.numSlides,
      model.title,
    );
    area.slide = model.slide;
    area.occupants = playerFinder(model.occupantsByID);
    area.presenter = model.presenterID ? playerFinder([model.presenterID])[0] : undefined;
    return area;
  }
}
