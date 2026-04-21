import { LightningElement, track, api } from 'lwc';
import getTemplatesByStaff from '@salesforce/apex/PmsStaffTemplateController.getTemplatesByStaff';
import saveOrSubmitStaffResponse from '@salesforce/apex/PmsStaffTemplateController.saveOrSubmitStaffResponse';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class TesseractappsPmsStaffViewLwc extends LightningElement {
    @track MyPmsFlag = true;
    @track MyGoalsFlag = false;
    @api orgId;
    @api staffId;
    @track templates = [];
    @track showDetails=false;
    @track selectedTemplate = {};
    @track isHome = true;

     get MyPmsClass(){
        return (this.isHome) ? 'menu-item1' : 'menu-item'; 
    
    }
    get MyGoalsClass(){
        return (this.MyGoalsFlag) ? 'menu-item1' : 'menu-item'; 
    
    }

   ratingOptions = [
    { label: 'Below Expectations', value: 'Below Expectations' },
    { label: 'Partially Meets Expectations', value: 'Partially Meets Expectations' },
    { label: 'Meets Expectations', value: 'Meets Expectations' },
    { label: 'Exceeds Expectations', value: 'Exceeds Expectations' },
    { label: 'Outstanding', value: 'Outstanding' }
];

    connectedCallback(){
        console.log('pms Staffid'+this.staffId);
        this.loadTemplates();
        
    }

 /*  loadTemplates() {
    getTemplatesByStaff({ staffId: this.staffId })
        .then(result => {
             console.log('Templates:', JSON.stringify(result));

            this.templates = result.map(template => {
                return {
                    ...template,
                    kpiCount: template.kpis?.length || 0,
                    okrCount: template.okrs?.length || 0,
                    competencyCount: template.competencies?.length || 0
                };
            });

            console.log('Templates:', JSON.stringify(this.templates));

        })
        .catch(error => {
            this.error = error;
            console.error('Error:', error);
        });
} */

        loadTemplates() {
    getTemplatesByStaff({ staffId: this.staffId })
        .then(result => {
          console.log('result:', JSON.stringify(result));
            this.templates = result.map(template => {

                // Merge KPI ratings into KPI array
                const kpis = template.kpis.map(kpi => ({
                    ...kpi,
                    staffRating: template.kpiRatings?.[kpi.Id] || '',
                    staffComment: template.kpiComments?.[kpi.Id] || ''
                }));

                // Merge OKR ratings
                const okrs = template.okrs.map(okr => ({
                    ...okr,
                    staffRating: template.okrRatings?.[okr.Id] || '',
                    staffComment: template.okrComments?.[okr.Id] || ''
                }));

                // Merge Competency ratings
                const competencies = template.competencies.map(comp => ({
                    ...comp,
                    staffRating: template.competencyRatings?.[comp.Id] || '',
                    staffComment: template.competencyComments?.[comp.Id] || ''
                }));

                return {
                    ...template,
                     effectiveDateFormatted: this.formatDate(template.effectiveDate),
                    kpis,
                    okrs,
                    competencies,
                    kpiCount: kpis.length,
                    okrCount: okrs.length,
                    competencyCount: competencies.length
                };
            });

             console.log('Templates:', JSON.stringify(this.templates));

        })
        .catch(error => {
            console.error(error);
        });
}

formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
}




    handleMyPms(){
        this.isHome = true;
        this.MyPmsFlag = true;
        this.MyGoalsFlag = false;
        this.showDetails = false;
    }
    handleMyGoals(){
         this.isHome = false;
        this.MyPmsFlag = false;
        this.MyGoalsFlag = true;
        this.showDetails = false;
    }
    handleClose(){
         this.isHome = true;
        this.MyPmsFlag = true;
        this.MyGoalsFlag = false;
        this.showDetails = false;

    }

    handleView(event) {
    const templateId = event.currentTarget.dataset.id;

    const selected = this.templates.find(
        temp => temp.templateId === templateId
    );
    const isAssignedToStaff = selected.Status === 'Assigned to Staff';
    console.log('isAssignedToStaff', isAssignedToStaff);

    this.selectedTemplate = {
        ...selected,
        kpiTabLabel: `KPIs (${selected.kpiCount})`,
        okrTabLabel: `OKRs (${selected.okrCount})`,
        competencyTabLabel: `Competencies (${selected.competencyCount})`,
        EditDisabled: !isAssignedToStaff,
    };

    console.log('Selected Template:', JSON.stringify(this.selectedTemplate));

    this.showDetails = true;
    this.MyPmsFlag = false;
}

   // ==========================
    // KPI HANDLERS
    // ==========================
    handleKpiRatingChange(event) {
        const id = event.target.dataset.id;
        const value = event.detail.value;

        this.selectedTemplate.kpis =
            this.selectedTemplate.kpis.map(kpi =>
                kpi.Id === id ? { ...kpi, staffRating: value } : kpi
            );

            console.log('KPIs:', JSON.stringify(this.selectedTemplate.kpis));
    }

    handleKpiCommentChange(event) {
        const id = event.target.dataset.id;
        const value = event.target.value;

        this.selectedTemplate.kpis =
            this.selectedTemplate.kpis.map(kpi =>
                kpi.Id === id ? { ...kpi, staffComment: value } : kpi
            );
    }

    // ==========================
    // OKR HANDLERS
    // ==========================
    handleOkrRatingChange(event) {
        const id = event.target.dataset.id;
        const value = event.detail.value;

        this.selectedTemplate.okrs =
            this.selectedTemplate.okrs.map(okr =>
                okr.Id === id ? { ...okr, staffRating: value } : okr
            );
    }

    handleOkrCommentChange(event) {
        const id = event.target.dataset.id;
        const value = event.target.value;

        this.selectedTemplate.okrs =
            this.selectedTemplate.okrs.map(okr =>
                okr.Id === id ? { ...okr, staffComment: value } : okr
            );
    }

    // ==========================
    // COMPETENCY HANDLERS
    // ==========================
    handleCompetencyRatingChange(event) {
        const id = event.target.dataset.id;
        const value = event.detail.value;

        this.selectedTemplate.competencies =
            this.selectedTemplate.competencies.map(comp =>
                comp.Id === id ? { ...comp, staffRating: value } : comp
            );
    }

    handleCompetencyCommentChange(event) {
        const id = event.target.dataset.id;
        const value = event.target.value;

        this.selectedTemplate.competencies =
            this.selectedTemplate.competencies.map(comp =>
                comp.Id === id ? { ...comp, staffComment: value } : comp
            );
    }

    // ==========================
    // BUILD PAYLOAD
    // ==========================
    buildPayload() {
        return {
            staffTemplateId: this.selectedTemplate.stafftemplateId,
            kpis: this.selectedTemplate.kpis,
            okrs: this.selectedTemplate.okrs,
            competencies: this.selectedTemplate.competencies
        };

    }

    // ==========================
    // SAVE DRAFT
    // ==========================
   /*  handleSaveDraft() {

        const payload = this.buildPayload();
        console.log('Payload:', JSON.stringify(payload));

        saveDraft({ request: payload })
            .then(() => {
                this.showToast('Success', 'Draft Saved Successfully', 'success');
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            }); 
    } */

    // ==========================
    // SUBMIT
    // ==========================
   /*  handleSubmit() {

        const payload = this.buildPayload();

        submitReview({ request: payload })
            .then(() => {
                this.showToast('Success', 'Submitted Successfully', 'success');
                this.selectedTemplate.status = 'Submitted_To_Manager';
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            });
    } */

    // ==========================
    // TOAST
    // ==========================
    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }


    handleSaveDraft() {

    const payload = this.buildPayload();

    console.log('Sending to Apex:', JSON.stringify(payload));

    saveOrSubmitStaffResponse({
        requestJson: JSON.stringify(payload),  // MUST MATCH APEX PARAM NAME
        isSubmit: false
    })
    .then(() => {
        this.showToast('Success', 'Draft Saved Successfully', 'success');
    })
    .catch(error => {
        console.error(error);
        this.showToast('Error', error.body?.message || 'Error', 'error');
    });
}

 handleSubmitreview() {

    const payload = this.buildPayload();

    console.log('Sending to Apex:', JSON.stringify(payload));

    saveOrSubmitStaffResponse({
        requestJson: JSON.stringify(payload),  // MUST MATCH APEX PARAM NAME
        isSubmit: true
    })
    .then(() => {
        this.showToast('Success', 'Review Submitted Successfully', 'success');
        this.handleClose();
    })
    .catch(error => {
        console.error(error);
        this.showToast('Error', error.body?.message || 'Error', 'error');
    });
}


}