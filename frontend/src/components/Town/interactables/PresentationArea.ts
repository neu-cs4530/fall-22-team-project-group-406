import PresentationAreaController from '../../../classes/PresentationAreaController';
import Interactable, { KnownInteractableTypes } from '../Interactable';

export default class PresentationArea extends Interactable {
  private _topicTextOrUndefined?: Phaser.GameObjects.Text;

  private _infoTextBox?: Phaser.GameObjects.Text;

  private _presentationArea?: PresentationAreaController;

  private _defaultDocument?: string;

  private _isInteracting = false;

  public get defaultDocument() {
    if (!this._defaultDocument) {
      return 'No Document Found';
    }
    return this._defaultDocument;
  }

  private get _topicText() {
    const ret = this._topicTextOrUndefined;
    if (!ret) {
      throw new Error('Expected topic text to be defined');
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
    this._topicTextOrUndefined = this.scene.add.text(
      this.x - this.displayWidth / 2,
      this.y + this.displayHeight / 2,
      '(No Topic)',
      { color: '#000000' },
    );
    this.setDepth(-1);
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
