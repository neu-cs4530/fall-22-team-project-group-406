The following two files were not able to be tested well:

- PresentationArea.ts
- SelectDocumentModal.tsx

The reason PresentationArea.ts was unable to be tested well is due to the fact that it relied
heavily on building off of the game scene. The game scene could not be made without having a full
controller and Town, so this file was unable to be tested automatically. To test this file manually,
a user can go to a PresentationArea in Covey.Town and ensure that they see a label that appears when
there is no PDF in the PresentationArea. The second thing that they should do is ensure that the
label disappears when they leave the PresentationArea. The final thing they should do is ensure the
the PresentationArea can be updated by adding a document.

The reason SelectDocumentModal.tsx was unable to be tested well is due to the fact that it is solely
a large, custom hook that cannot be activated except by using the buttons on the Modal. This can be
tested by going into Covey.Town and opening up a modal by beginning the process to choose a file.
The important aspects of this modal are

- While the Modal is open, no keys should work to move your character
- When clicking outside the modal, on the 'X', or on the 'Cancel' button, the Modal should close,
  and you should be able to move around the map again.
- The Modal should have the correct Title: "Create presentation for" [name of the presentationArea]
- When CreatePresentation is clicked, the title of the presentationArea should change to the new
  title, and the document specified should open up.
  - If the document is unable to open, the screen should show "Failed to Load PDF"
