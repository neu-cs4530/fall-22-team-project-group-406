import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { usePresentationAreaController } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import { PresentationArea as PresentationAreaModel } from '../../../types/CoveyTownSocket';
import PresentationArea from './PresentationArea';

/**
 * Modal for selecting a document to present in a presentation area
 */
export default function SelectDocumentModal({
  isOpen,
  close,
  presentationArea,
}: {
  isOpen: boolean;
  close: () => void;
  presentationArea: PresentationArea;
}): JSX.Element {
  const coveyTownController = useTownController();
  const presentationAreaController = usePresentationAreaController(presentationArea?.name);

  const [document, setDocument] = useState<string>(presentationArea?.defaultDocument || '');

  useEffect(() => {
    if (isOpen) {
      coveyTownController.pause();
    } else {
      coveyTownController.unPause();
    }
  }, [coveyTownController, isOpen]);

  const closeModal = useCallback(() => {
    coveyTownController.unPause();
    close();
  }, [coveyTownController, close]);

  const toast = useToast();

  const createPresentationArea = useCallback(async () => {
    if (document && presentationAreaController) {
      const request: PresentationAreaModel = {
        id: presentationAreaController.id,
        document,
        slide: 0,
        numSlides: 0,
        occupantsByID: [],
      };
      try {
        await coveyTownController.createPresentationArea(request);
        toast({
          title: 'Document set!',
          status: 'success',
        });
        // Set the presenter to the current player
        presentationAreaController.presenter = coveyTownController.ourPlayer;
        coveyTownController.unPause();
      } catch (err) {
        if (err instanceof Error) {
          toast({
            title: 'Unable to set Document URL',
            description: err.toString(),
            status: 'error',
          });
        } else {
          console.trace(err);
          toast({
            title: 'Unexpected Error',
            status: 'error',
          });
        }
      }
    }
  }, [coveyTownController, document, presentationAreaController, toast]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        closeModal();
        coveyTownController.unPause();
      }}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Pick a document to present in {presentationAreaController?.id} </ModalHeader>
        <ModalCloseButton />
        <form
          onSubmit={ev => {
            ev.preventDefault();
            createPresentationArea();
          }}>
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel htmlFor='document'>Document URL</FormLabel>
              <Input
                id='document'
                name='document'
                value={document}
                onChange={e => setDocument(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={createPresentationArea}>
              Set document
            </Button>
            <Button onClick={closeModal}>Cancel</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
