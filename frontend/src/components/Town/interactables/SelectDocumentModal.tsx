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
import { makeStyles } from '@material-ui/core/styles';
import React, { useCallback, useEffect, useState } from 'react';
import { usePresentationAreaController } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import { PresentationArea as PresentationAreaModel } from '../../../types/CoveyTownSocket';
import PresentationArea from './PresentationArea';

const useStyles = makeStyles({
  // style rule
  presentationFormHeader: () => ({
    padding: '1rem 2.5rem !important',
    textAlign: 'center',
  }),
});

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
  const [title, setTitle] = useState<string>(presentationArea?.titleText?.text || '');

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
    if (document && title && presentationAreaController) {
      const request: PresentationAreaModel = {
        id: presentationAreaController.id,
        document,
        title: title,
        slide: 0,
        numSlides: 0,
        occupantsByID: [],
        presenterID: coveyTownController.ourPlayer.id,
      };
      try {
        await coveyTownController.createPresentationArea(request);
        toast({
          title: 'Presentation Created!',
          status: 'success',
        });
        // Set the presenter to the current player
        presentationAreaController.presenter = coveyTownController.ourPlayer;
        coveyTownController.unPause();
      } catch (err) {
        if (err instanceof Error) {
          toast({
            title: 'Unable to create presentation',
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
  }, [coveyTownController, document, presentationAreaController, toast, title]);

  const classes = useStyles();

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        closeModal();
        coveyTownController.unPause();
      }}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader className={classes.presentationFormHeader}>
          Create presentation for {presentationAreaController?.id}
        </ModalHeader>
        <ModalCloseButton />
        <form
          onSubmit={ev => {
            ev.preventDefault();
            createPresentationArea();
          }}>
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel htmlFor='title'>Presentation Title</FormLabel>
              <Input
                id='title'
                name='title'
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </FormControl>
          </ModalBody>
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
              Create Presentation
            </Button>
            <Button onClick={closeModal}>Cancel</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
