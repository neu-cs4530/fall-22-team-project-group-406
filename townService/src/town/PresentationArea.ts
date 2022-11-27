import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import {
  BoundingBox,
  PresentationArea as PresentationAreaModel,
  TownEmitter,
} from '../types/CoveyTownSocket';
import InteractableArea from './InteractableArea';

export default class PresentationArea extends InteractableArea {
  /* The document url of the presentation area, or undefined if it is not set */
  public document?: string;

  /* The current slide number of the document */
  public slide: number;

  /* The maximum number of slides of the document */
  public numSlides: number;
  
  /* The title of the presentation area, or undefined if it is not set */
  public title?: string;

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
    { document, id, slide, numSlides, title }: PresentationAreaModel,
    coordinates: BoundingBox,
    townEmitter: TownEmitter,
  ) {
    super(id, coordinates, townEmitter);
    this.document = document;
    this.slide = slide;
    this.numSlides = numSlides;
    this.title = title;
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
    };
  }

  /**
   * Updates the state of this PresentationArea, setting the slide, and document properties
   *
   * @param presentationArea updated model
   */
  public updateModel({ slide, document, title }: PresentationAreaModel) {
    this.slide = slide;
    this.document = document;
    this.title = title;
  public updateModel({ slide, document, numSlides }: PresentationAreaModel) {
    this.slide = slide;
    this.document = document;
    this.numSlides = numSlides;
    this.title = title;
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
        slide: 0,
        numSlides: 0,
        title: undefined,
      },
      rect,
      broadcastEmitter,
    );
  }
}
