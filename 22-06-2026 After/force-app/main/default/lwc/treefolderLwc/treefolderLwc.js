import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'; 
import canDeleteFolder from '@salesforce/apex/ClientAttachmentHandler.canDeleteFolder';
import deleteFolder from '@salesforce/apex/ClientAttachmentHandler.deleteFolder';

export default class FolderNode extends LightningElement {
    @api node;
    @api level;
    @api selectedId;
    @api isStaff;
    @track showMenu = false;

    isOpen = false;

    get hasChildren() {
        return this.node.children && this.node.children.length > 0;
    }

    get nextLevel() {
        return Number(this.level) + 1;
    }

    get indentStyle() {
        return `padding-left:${this.level * 12}px`;
    }

    get computedClass() {
        return 'folder-item' + (this.node.Id === this.selectedId ? ' selected-folder' : '');
    }

    get toggleIcon() {
        return this.isOpen ? 'keyboard_arrow_down' : 'chevron_right';
    }

    get folderIcon() { 
        return this.isOpen ? 'folder_open' : 'folder'; 
    }

    connectedCallback() {
        document.addEventListener('click', this.handleOutsideClick.bind(this));
    }

    disconnectedCallback() {
        document.removeEventListener('click', this.handleOutsideClick.bind(this));
    }

    handleOutsideClick() {
        this.showMenu = false;
    }

    toggle(event) {
        event.stopPropagation();
        this.isOpen = !this.isOpen;
    }

    handleClick(event) {
        event.stopPropagation();

        if (this.hasChildren) {
            this.isOpen = true;
        }

        this.dispatchEvent(new CustomEvent('folderselect', {
            detail: { id: this.node.Id },
            bubbles: true,
            composed: true
        }));
    }

    handleChildSelect(event) {
        this.dispatchEvent(new CustomEvent('folderselect', {
            detail: event.detail,
            bubbles: true,
            composed: true
        }));
    }

    toggleMenu(event) {
        event.stopPropagation();
        this.showMenu = !this.showMenu;
    }

    handleEdit(event) {
        event.stopPropagation();

        this.dispatchEvent(new CustomEvent('editfolder', {
            detail: { id: this.node.Id },
            bubbles: true,
            composed: true
        }));

        this.showMenu = false;
    }

    // handlePermissions(event) {
    //     event.stopPropagation();

    //     this.dispatchEvent(new CustomEvent('permissions', {
    //         detail: { id: this.node.Id },
    //         bubbles: true,
    //         composed: true
    //     }));

    //     this.showMenu = false;
    // }

handlePermissions(event) {

    event.stopPropagation();

    const folderId =
        event.currentTarget.dataset.id;

    console.log(
        '🔐 Permission Click Folder Id:',
        folderId
    );

    this.dispatchEvent(
        new CustomEvent('permissions', {
            detail: {
                id: folderId
            },
            bubbles: true,
            composed: true
        })
    );

    this.showMenu = false;
}

handleChildPermissions(event) {

    event.stopPropagation();

    console.log(
        '🟢 Forward Child Permission:',
        event.detail.id
    );

    this.dispatchEvent(
        new CustomEvent('permissions', {
            detail: event.detail,
            bubbles: true,
            composed: true
        })
    );
}

    async handleDelete(event) {

        event.stopPropagation();

        try {

            const folderId = event.currentTarget.dataset.id;

            console.log('🗑 Folder Delete Clicked:', folderId);

            // VALIDATE FROM APEX
            const isAllowed = await canDeleteFolder({
                folderId: folderId
            });

            console.log('✅ canDeleteFolder:', isAllowed);

            // BLOCK DELETE
            if (!isAllowed) {

                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Cannot Delete Folder',
                        message:
                            'Folder cannot be deleted because it contains files or subfolders.',
                        variant: 'error'
                    })
                );

                return;
            }

            // DELETE
            await deleteFolder({
                folderId: folderId
            });

            console.log('✅ Folder Deleted');

            // SUCCESS TOAST
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Folder deleted successfully',
                    variant: 'success'
                })
            );

            // REFRESH TREE
            this.dispatchEvent(
                new CustomEvent('refreshfolders', {
                    bubbles: true,
                    composed: true
                })
            );

            this.showMenu = false;

        } catch(error) {

            console.error('❌ Folder Delete Error:', error);

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message:
                        error?.body?.message || 'Unable to delete folder',
                    variant: 'error'
                })
            );
        }
    }

    get isContactFolder() {

        // Contacts root
        if (this.node.Id === 'CONTACTS_NODE') {
            return true;
        }

        // Contact child folders
        return this.node.isContact === true;
    }
    
    handleRefreshFolders(event) {

        this.dispatchEvent(
            new CustomEvent('refreshfolders', {
                bubbles: true,
                composed: true
            })
        );
    }
}