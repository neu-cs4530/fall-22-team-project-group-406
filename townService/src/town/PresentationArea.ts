import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import {
  BoundingBox,
  PresentationArea as PresentationAreaModel,
  TownEmitter,
} from '../types/CoveyTownSocket';
import InteractableArea from './InteractableArea';
import Player from '../lib/Player';

export default class PresentationArea extends InteractableArea {
  /* The document url of the presentation area, or undefined if it is not set */
  public document?: string;

  /* The current slide number of the document */
  public slide: number;

  /* The maximum number of slides of the document */
  public numSlides: number;

  /* The title of the presentation area, or undefined if it is not set */
  public title?: string;

  /* The presenter of the presentation area, or undefined if it is not set */
  public presenterID?: string;

  /** The presentation area is "active" when there are players inside of it  */
  public get isActive(): boolean {
    return this._occupants.length > 0;
  }

  /**
   * Creates a new PresentationArea
   *
   * @param presentationAreaModel model containing this area's current presentation, slide, and its ID
   * @param coordinates  the bounding box that defines this presentation area
   * @param townEmitter a broadcast emitter that can be used to emit updates to players
   */
  public constructor(
    { document, id, slide, numSlides, title, presenterID }: PresentationAreaModel,
    coordinates: BoundingBox,
    townEmitter: TownEmitter,
  ) {
    super(id, coordinates, townEmitter);
    this.document = document;
    this.slide = slide;
    this.numSlides = numSlides;
    this.title = title;
    this.presenterID = presenterID;
  }

  /**
   * Removes a player from this presentation area.
   *
   * Extends the base behavior of InteractableArea to reset the document, title,
   * and presenter if the player to be removed is the presenter.
   *
   * @param player
   */
  public remove(player: Player) {
    super.remove(player);
    if (player.id === this.presenterID) {
      this.document = undefined;
      this.title = undefined;
      this.presenterID = undefined;
      this._emitAreaChanged();
    }
  }

  /**
   * Convert this PresentationArea instance to a simple PresentationAreaModel suitable for
   * transporting over a socket to a client.
   */
  public toModel(): PresentationAreaModel {
    return {
      id: this.id,
      occupantsByID: this.occupantsByID,
      document: this.document,
      slide: this.slide,
      numSlides: this.numSlides,
      title: this.title,
      presenterID: this.presenterID,
    };
  }

  /**
   * Updates the state of this PresentationArea, setting the slide, and document properties
   *
   * @param presentationArea updated model
   */
  public updateModel({ slide, document, numSlides, title, presenterID }: PresentationAreaModel) {
    this.slide = slide;
    this.document = document;
    this.numSlides = numSlides;
    this.title = title;
    this.presenterID = presenter;
  }

  /**
   * Creates a new PresentationArea object that will represent a Presentation Area object in the town map.
   * @param mapObject An ITiledMapObject that represents a rectangle in which this presentation area exists
   * @param broadcastEmitter An emitter that can be used by this presentation area to broadcast updates
   * @returns
   */
  public static fromMapObject(
    mapObject: ITiledMapObject,
    broadcastEmitter: TownEmitter,
  ): PresentationArea {
    const { name, width, height } = mapObject;
    if (!width || !height) {
      throw new Error(`Malformed presentation area ${name}`);
    }
    const rect: BoundingBox = { x: mapObject.x, y: mapObject.y, width, height };
    return new PresentationArea(
      {
        id: name,
        occupantsByID: [],
        document: undefined,
        slide: 0,
        numSlides: 0,
        title: undefined,
      },
      rect,
      broadcastEmitter,
    );
  }
}
