import { Container } from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import PresentationAreaController from '../../../classes/PresentationAreaController';
import { useInteractable, usePresentationAreaController } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import PresentationAreaInteractable from './PresentationArea';
import SelectDocuentModal from './SelectDocumentModal';

export class MockReactPdf extends Document {
  render(): React.ReactNode {
    return <></>;
  }
}

export function PresentationAreaDocument({
  controller,
}: {
  controller: PresentationAreaController;
}): JSX.Element {
  const [document, setDocument] = useState<string | undefined>(controller.document);
  const [currentSlide, setCurrentSlide] = useState<number>(controller.slide);
  const townController = useTownController();

  const reactPdfRef = useRef<Document>(null);
  const reactPdfPageRef = useRef<Page>(null);

  useEffect(() => {
    const slideListener = (newSlide: number) => {
      setCurrentSlide(newSlide);
    };
    controller.addListener('slideChange', slideListener);
    return () => {
      controller.removeListener('slideChange', slideListener);
    };
  }, [controller]);

  useEffect(() => {
    const documentListener = (newDocument: string | undefined) => {
      setDocument(newDocument);
    };
    controller.addListener('documentChange', documentListener);
    return () => {
      controller.removeListener('documentChange', documentListener);
    };
  });

  return (
    <Container className='participant-wrapper'>
      Presentation Area: {controller.id}
      <Document file={document} ref={reactPdfRef}>
        <Page
          pageIndex={currentSlide}
          ref={reactPdfPageRef}
          onRenderSuccess={() => {
            townController.emitPresentationAreaUpdate(controller);
          }}
        />
      </Document>
    </Container>
  );
}

export function PresentationArea({
  presentationArea,
}: {
  presentationArea: PresentationAreaInteractable;
}): JSX.Element {
  const townController = useTownController();
  const presentationAreaController = usePresentationAreaController(presentationArea.name);
  const [selectIsOpen, setSelectIsOpen] = useState(
    presentationAreaController.document === undefined,
  );
  const [presentationAreaDocument, setPresentationAreaDocument] = useState(
    presentationAreaController.document,
  );
  useEffect(() => {
    const setDocument = (document: string | undefined) => {
      if (!document) {
        townController.interactableEmitter.emit('endIteraction', presentationAreaController);
      } else {
        setPresentationAreaDocument(document);
      }
    };
    presentationAreaController.addListener('changeDocument', setDocument);
    return () => {
      presentationAreaController.removeListener('changeDocument', setDocument);
    };
  }, [presentationAreaController, townController]);

  useEffect(() => {
    const setSlide = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        presentationAreaController.slide += 1;
      }
      if (event.key === 'ArrowLeft') {
        presentationAreaController.slide -= 1;
      }
    };
    document.addEventListener('keydown', setSlide);
    return () => {
      document.removeEventListener('keydown', setSlide);
    };
  }, [presentationAreaController]);

  if (!presentationAreaDocument) {
    return (
      <SelectDocuentModal
        isOpen={selectIsOpen}
        close={() => setSelectIsOpen(false)}
        presentationArea={presentationArea}
      />
    );
  }
  return (
    <>
      <PresentationAreaDocument controller={presentationAreaController} />
    </>
  );
}

export default function PresentationAreaWrapper(): JSX.Element {
  const presentationArea = useInteractable<PresentationAreaInteractable>('presentationArea');
  if (presentationArea) {
    return <PresentationArea presentationArea={presentationArea} />;
  }
  return <></>;
}
