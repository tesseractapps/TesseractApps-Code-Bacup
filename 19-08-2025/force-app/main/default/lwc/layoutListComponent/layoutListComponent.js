// layoutListComponent.js
import { LightningElement, track, api } from 'lwc';
import getAllLayouts from '@salesforce/apex/LayoutController.getAllLayouts';
import deleteLayout from '@salesforce/apex/LayoutController.deleteLayout';

import getLayoutData from '@salesforce/apex/LayoutController.getLayoutData';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { publish, MessageContext } from 'lightning/messageService';
import LAYOUT_MESSAGE_CHANNEL from '@salesforce/messageChannel/LayoutMessageChannel__c';
import { wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getDefaultFormLayout from '@salesforce/apex/LayoutController.getDefaultFormLayout';
import StaticForms from '@salesforce/resourceUrl/Static_Forms';

const FORM_IMAGE_1 = `${StaticForms}/form1.png`;
const FORM_IMAGE_2 = `${StaticForms}/form2.png`;

const formImages = [FORM_IMAGE_1, FORM_IMAGE_2];


export default class LayoutListComponent extends NavigationMixin(LightningElement) {
    @track defaultLayouts = [];
    @track customLayouts = [];
    @api selectedFormType = '';
    @wire(MessageContext) messageContext;
    @api orgid;
    layoutDataWireResult;

    @wire(getAllLayouts, { orgId: '$orgid' })
wiredLayoutData(result) {
    this.layoutDataWireResult = result;

    if (result.data) {
        const layoutMap = result.data;

        this.customLayouts = layoutMap.CustomLayouts.map(layout => ({
            ...layout,
            layoutName: layout.layoutName,
            displayName: layout.displayName,
            image: this.getRandomFormImage()
        }));

        this.defaultLayouts = layoutMap.DefaultLayouts.map(layout => ({
            ...layout,
            layoutName: layout.layoutName,
            displayName: layout.displayName
        }));

        this.pageNumber = 1;
        this.paginateLayouts();
    } else if (result.error) {
        console.error('❌ Error in wired layout fetch:', result.error);
        this.showToast('Error', 'Failed to retrieve saved layouts.', 'error');
    }
}


    // connectedCallback() {
    //     this.fetchAllLayouts();
    //     console.log('📌 Received Org ID:', this.orgid);
    // }

    // Fetch all saved layouts
//     fetchAllLayouts() {
//     if (!this.orgid) {
//         console.warn('⚠️ Org ID is undefined, skipping fetch.');
//         return;
//     }

//     console.log('📌 Fetching layouts for Org ID:', this.orgid);

//     getAllLayouts({ orgId: this.orgid })
//         .then((layoutMap) => {
//             // Store full custom layouts list
//             this.customLayouts = layoutMap.CustomLayouts.map(layout => ({
//                 ...layout,
//                 layoutName: layout.layoutName,
//                 displayName: layout.displayName,
//                 image: this.getRandomFormImage()
//             }));

//             // Paginate custom layouts
//             this.totalPages = Math.ceil(this.customLayouts.length / this.pageSize);
//             this.currentPage = 1; // Reset to page 1 when reloading
//             this.paginateLayouts();

//             // Handle default layouts
//             this.defaultLayouts = layoutMap.DefaultLayouts.map(layout => ({
//                 ...layout,
//                 layoutName: layout.layoutName,
//                 displayName: layout.displayName
//             }));

//             console.log(`✅ Loaded ${this.customLayouts.length} custom layouts.`);
//         })
//         .catch((error) => {
//             console.error('❌ Error fetching layouts:', error);
//             this.dispatchEvent(
//                 new ShowToastEvent({
//                     title: 'Error',
//                     message: 'Failed to retrieve saved layouts.',
//                     variant: 'error',
//                 })
//             );
//         });
// }

    
    getRandomFormImage() {
    const index = Math.floor(Math.random() * formImages.length);
    return formImages[index];
}

    
    
    
    
    

    renderedCallback() {
        // Attach event listeners for edit and delete links
        this.template.querySelectorAll('.edit-link').forEach((link) => {
            link.addEventListener('click', this.handleEditLayout.bind(this));
        });

        this.template.querySelectorAll('.delete-link').forEach((link) => {
            link.addEventListener('click', this.handleDeleteLayout.bind(this));
        });
    }

    // Handle edit action and dispatch event
    // Handle edit action and dispatch event
    async handleEditLayout(event) {
        try {
            const layoutId = event.detail.layoutId; // Get layout ID to edit
            const layoutData = await getLayoutData({ layoutName: layoutId }); // Fetch data based on layout ID
            
            if (layoutData) {
                // Load layout data into the component for editing
                this.layoutId = layoutId;
                this.formTitle = layoutData.title || ''; // Set the title
                this.tableRows = JSON.parse(layoutData.layoutJson).tableRows || []; // Load table structure
                this.selectedFormType = layoutData.layoutName; // Set the dropdown to the layout name
                console.log("Editing layout:", layoutData);
    
                // Update dropdown value
                requestAnimationFrame(() => {
                    const dropdown = this.template.querySelector('.form-dropdown');
                    if (dropdown) dropdown.value = this.selectedFormType;
                });
    
                this.showToast('Success', 'Layout loaded for editing.', 'success');
            } else {
                this.showToast('Error', 'No layout data found for editing.', 'error');
            }
        } catch (error) {
            console.error('Error loading layout for editing:', error);
            this.showToast('Error', 'Failed to load layout for editing.', 'error');
        }
    }
    
    // Handle the edit action, emit layout ID to dragdropcomp
    handleEditLayout(event) {
    const layoutName = event.currentTarget.dataset.id;

    getLayoutData({ layoutName })
        .then(layoutData => {
            console.log('✅ Retrieved layout data for editing:', layoutData);

            const message = {
                layoutName: layoutData.layoutName,      // Unique identifier (Name)
                formType: layoutData.displayName,       // Display-friendly Name__c
                layoutJSON: layoutData.layoutJson,      // JSON structure
                formModule: layoutData.formModule,      // ✅ Form Module (Customizable/Incident)
                actionType: 'edit',
                title: layoutData.title,
            };

            console.log('📤 Publishing layout edit message:', JSON.stringify(message));

            publish(this.messageContext, LAYOUT_MESSAGE_CHANNEL, message);
        })
        .catch(error => {
            console.error('❌ Error loading layout for editing:', error);
            this.showToast('Error', 'Failed to load layout. Please try again.', 'error');
        });
}

    
    
    // Single, consolidated handleDeleteLayout method
async handleDeleteLayout(event) {
    const layoutName = event.currentTarget.dataset.id;
    console.log('Captured layoutName for deletion:', layoutName); // Log to confirm value

    if (!layoutName) {
        this.showToast('Error', 'Layout Name is missing for deletion.', 'error');
        return;
    }

    try {
        // Call Apex delete function with correct parameter
        await deleteLayout({ layoutName });
        console.log('Layout deleted successfully:', layoutName);

        // Refresh the layout list and show success toast
        // this.fetchAllLayouts();
        await refreshApex(this.layoutDataWireResult);

        this.showToast('Success', 'Draft Form deleted successfully.', 'success');
    } catch (error) {
        console.error('Error deleting layout:', error);
        this.showToast('Error', 'Failed to delete layout.', 'error');
    }
}

    
    
    
    
    

// // Handle the delete action, emit layout ID to dragdropcomp
// async handleDeleteLayout(event) {
//     const layoutName = event.currentTarget.dataset.id;
//     console.log('Captured layoutName for deletion:', layoutName); // Check if layoutName is populated correctly

//     if (!layoutName) {
//         this.showToast('Error', 'Layout Name is missing for deletion.', 'error');
//         return;
//     }

//     try {
//         // Call Apex delete function
//         await deleteLayout({ layoutName });
//         this.dispatchEvent(new CustomEvent('refreshlayouts'));
//         this.showToast('Success', 'Layout deleted successfully.', 'success');
//     } catch (error) {
//         console.error('Error deleting layout:', error);
//         this.showToast('Error', 'Failed to delete layout.', 'error');
//     }
// }









    
    
    

    
    
    
    
handleCloneLayout(event) {
    const layoutName = event.currentTarget.dataset.id; // Retrieve Name (unique identifier)
    console.log('Cloning layout with Name:', layoutName);

    if (layoutName) {
        getDefaultFormLayout({ layoutName }) // Pass Name (not Name__c) to Apex
            .then(layoutData => {
                console.log('Layout data retrieved for cloning:', layoutData);

                // Convert Proxy object to a regular object
                const clonedLayoutData = JSON.parse(JSON.stringify(layoutData));

                publish(this.messageContext, LAYOUT_MESSAGE_CHANNEL, {
                    actionType: 'clone',
                    formType: clonedLayoutData.formType,
                    layoutJSON: clonedLayoutData.Form_JSON__c,
                    Name__c: clonedLayoutData.Name__c
                });
            })
            .catch(error => {
                console.error('Error cloning layout:', error);
                this.showToast('Error', 'Failed to clone layout. Please try again.', 'error');
            });
    } else {
        console.warn('No layoutName found for cloning.');
    }
}








    
    
    
    
    

    // Show toast messages
    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    // // Handle delete action
    // async handleDeleteLayout(event) {
    //     try {
    //         const layoutId = event.target.dataset.id; // Retrieve the ID of the layout to delete
    //         await deleteLayout({ layoutName: layoutId }); // Call Apex to delete the layout
    
    //         // Refresh the layout list in layoutListComponent to reflect changes
    //         this.dispatchEvent(new CustomEvent('refreshlayouts'));
    //         this.showToast('Success', 'Layout deleted successfully.', 'success');
    //     } catch (error) {
    //         console.error('Error deleting layout:', error);
    //         this.showToast('Error', 'Failed to delete layout.', 'error');
    //     }
    // }


    handleBackToForm() {
        this.dispatchEvent(new CustomEvent('backtoform'));
    }

    // Handle delete action
    // handleDeleteLayout(event) {
    //     const layoutId = event.target.dataset.id;

    //     deleteLayout({ layoutId })
    //         .then(() => {
    //             this.fetchAllLayouts();
    //             this.dispatchEvent(
    //                 new ShowToastEvent({
    //                     title: 'Success',
    //                     message: 'Layout deleted successfully.',
    //                     variant: 'success',
    //                 })
    //             );
    //         })
    //         .catch((error) => {
    //             console.error('Error deleting layout:', error);
    //             this.dispatchEvent(
    //                 new ShowToastEvent({
    //                     title: 'Error',
    //                     message: 'Failed to delete layout.',
    //                     variant: 'error',
    //                 })
    //             );
    //         });
    // }



@track pageNumber = 1;
@track pageSize = 10;
@track totalRecords = 0;
@track totalPages = 0;
@track bDisableFirst = true;
@track bDisableLast = true;
@track paginatedLayouts = [];

pageSizeOptions = [10, 15, 20];


paginateLayouts() {
    this.totalRecords = this.customLayouts.length;
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize);

    const start = (this.pageNumber - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedLayouts = this.customLayouts.slice(start, end);

    this.bDisableFirst = this.pageNumber === 1;
    this.bDisableLast = this.pageNumber === this.totalPages;
}
firstPage() {
    this.pageNumber = 1;
    this.paginateLayouts();
}

lastPage() {
    this.pageNumber = this.totalPages;
    this.paginateLayouts();
}

previousPage() {
    if (this.pageNumber > 1) {
        this.pageNumber--;
        this.paginateLayouts();
    }
}

nextPage() {
    if (this.pageNumber < this.totalPages) {
        this.pageNumber++;
        this.paginateLayouts();
    }
}

handleRecordsPerPage(event) {
    this.pageSize = parseInt(event.target.value, 10);
    this.pageNumber = 1;
    this.paginateLayouts();
}


}