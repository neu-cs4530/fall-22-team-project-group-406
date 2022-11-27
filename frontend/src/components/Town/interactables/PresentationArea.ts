import PresentationAreaController from '../../../classes/PresentationAreaController';
import Interactable, { KnownInteractableTypes } from '../Interactable';
import TownController from '../../../classes/TownController';
import TownGameScene from '../TownGameScene';

export default class PresentationArea extends Interactable {
  private _titleTextOrUndefined?: Phaser.GameObjects.Text;

  private _infoTextBox?: Phaser.GameObjects.Text;

  private _presentationArea?: PresentationAreaController;

  private _defaultDocument?: string;

  private _isInteracting = false;

  private _townController: TownController;

  constructor(scene: TownGameScene) {
    super(scene);
    this._townController = scene.coveyTownController;
    this.setTintFill();
    this.setAlpha(0.3);
    this._townController.addListener('presentationAreasChanged', this._updatePresentationAreas);
  }

  public get defaultDocument() {
    if (!this._defaultDocument) {
      return 'No Document Found';
    }
    return this._defaultDocument;
  }

  public get titleText() {
    const ret = this._titleTextOrUndefined;
    if (!ret) {
      throw new Error('Expected title text to be defined');
    }
    return ret;
  }

  addedToScene() {
    super.addedToScene();
    this.setTintFill();
    this.setAlpha(0.3);

    this._defaultDocument = this.getData('document');
    this.scene.add.text(
      this.x - this.displayWidth / 2,
      this.y - this.displayHeight / 2,
      this.name,
      { color: '#FFFFFF', backgroundColor: '#000000' },
    );
    this._titleTextOrUndefined = this.scene.add.text(
      this.x - this.displayWidth / 2,
      this.y + this.displayHeight / 2,
      '(No Title)',
      { color: '#000000' },
    );
    this.setDepth(-1);
    this._updatePresentationAreas(this._townController.presentationAreas);
  }

  private _updatePresentationAreas(areas: PresentationAreaController[]) {
    const area = areas.find(eachAreaInController => eachAreaInController.id === this.name);
    if (area !== this._presentationArea) {
      if (area === undefined) {
        this._presentationArea = undefined;
        this.titleText.text = '(No title)';
      } else {
        this._presentationArea = area;
        if (this.isOverlapping) {
          this._scene.moveOurPlayerTo({ interactableID: this.name });
        }
        const updateListener = (newTopic: string | undefined) => {
          if (newTopic) {
            if (this._infoTextBox && this._infoTextBox.visible) {
              this._infoTextBox.setVisible(false);
            }
            this.titleText.text = newTopic;
          } else {
            this.titleText.text = '(No title)';
          }
        };
        updateListener(area.title);
        area.addListener('titleChange', updateListener);
      }
    }
  }

  private _showInfoBox() {
    if (!this._infoTextBox) {
      this._infoTextBox = this.scene.add
        .text(
          this.scene.scale.width / 2,
          this.scene.scale.height / 2,
          `Press space to present the ${this.name} Document`,
          { color: '#000000', backgroundColor: '#FFFFFF' },
        )
        .setScrollFactor(0)
        .setDepth(30);
    }
    this._infoTextBox.setVisible(true);
    this._infoTextBox.x = this.scene.scale.width / 2 - this._infoTextBox.width / 2;
  }

  overlap(): void {
    if (this._presentationArea === undefined) {
      this._showInfoBox();
    }
  }

  overlapExit(): void {
    this._infoTextBox?.setVisible(false);
    if (this._isInteracting) {
      this.townController.interactableEmitter.emit('endInteraction', this);
      this._isInteracting = false;
    }
  }

  interact(): void {
    this._infoTextBox?.setVisible(false);
    this._isInteracting = true;
  }

  getType(): KnownInteractableTypes {
    return 'presentationArea';
  }
}
