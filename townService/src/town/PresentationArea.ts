import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import Player from '../lib/Player';
import {
  BoundingBox,
  PresentationArea as PresentationAreaModel,
  TownEmitter,
} from '../types/CoveyTownSocket';
import InteractableArea from './InteractableArea';

export default class PresentationArea extends InteractableArea {
  /* The topic of the presentation area, or undefined if it is not set */
  public document?: string;

  public slide: number;

  public numSlides: number;

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
    { document, id, slide, numSlides, presenterID }: PresentationAreaModel,
    coordinates: BoundingBox,
    townEmitter: TownEmitter,
  ) {
    super(id, coordinates, townEmitter);
    this.document = document;
    this.slide = slide;
    this.numSlides = numSlides;
    this.presenterID = presenterID;
  }

  /**
   * Removes a player from this presentation area.
   *
   * Extends the base behavior of InteractableArea to set the document of this PresentationArea to undefined and
   * emit an update to other players in the town when the last presenter leaves.
   *
   * @param player
   */
  public remove(player: Player) {
    super.remove(player);
    if (player.id === this.presenterID) {
      this.document = undefined;
      this.slide = 0;
      this.numSlides = 0;
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
    };
  }

  /**
   * Updates the state of this PresentationArea, setting the slide, and document properties
   *
   * @param presentationArea updated model
   */
  public updateModel({ slide, document, numSlides, presenterID }: PresentationAreaModel) {
    this.slide = slide;
    this.document = document;
    this.numSlides = numSlides;
    this.presenterID = presenterID;
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
      throw new Error(`Malformed viewing area ${name}`);
    }
    const rect: BoundingBox = { x: mapObject.x, y: mapObject.y, width, height };
    return new PresentationArea(
      {
        id: name,
        occupantsByID: [],
        document: undefined,
        presenterID: undefined,
        slide: 0,
        numSlides: 0,
      },
      rect,
      broadcastEmitter,
    );
  }
}
