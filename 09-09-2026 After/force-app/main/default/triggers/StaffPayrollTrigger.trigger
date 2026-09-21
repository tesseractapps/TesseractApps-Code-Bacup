/**
    * @description       : 
    * @author            : Raja Sekhar Reddy
    * @group             : 
    * @Test              : StaffPayrollTrigerTest
    * @last modified on  : 06-20-2023
    * @last modified by  : Raja Sekhar Reddy
    **/
    trigger StaffPayrollTrigger on Staff_Payroll_Setting__c (before insert,before update,after insert, after update,after delete) {
        if(Trigger.isBefore && Trigger.isUpdate){       
        integer yr;          
             for(Staff_Payroll_Setting__c staffPay : trigger.new){  
                 system.debug('payment process date ==>'+staffPay.Pay_Date__c);
                 system.debug('scalee >>'+staffPay.Tax_free_threshold__c);
                 if(staffPay.Staff_TFN_Number__c!=null && staffPay.Staff_TFN_Number__c!=''){
                     System.debug('TFN Not null '+staffPay.Staff_TFN_Number__c);
                     Decimal grossSalary =0;
                     Decimal taxableGrossSalary = 0;
                     staffPay.Super_Annuation1__c =0;
                     staffPay.Tax_on_income__c =0;
                     if(staffPay.Type_of_User__c =='ICT User'){
                         staffPay.Gross_Salary__c = 0;
                         staffPay.Gross_Salary__c = staffPay.Total_Hours__c*staffPay.Working_Hours_Rate__c;  
                     }
    
                     staffPay.Management_Fee1__c = (staffPay.Gross_Salary__c * staffPay.Management_FeeFinal__c)/100; 
                     // praveen code starts here 
                     // Defining variables for start year and end year
                     Integer startyear;
                     Integer endyear;
                     string scale;
                     if(staffPay.Tax_free_threshold__c=='Without Tax free threshold'){
                         scale='Scale One'; 
                     }else{
                         scale='Scale Two'; 
                     }
                     if(staffPay.Pay_Date__c ==null){
                         staffPay.Pay_Date__c =staffPay.PayRun_Date__c ;
                     }
                     // Define the financial year start and end dates
                     Integer inputYear  =  staffPay.Pay_Date__c.year();
                     Integer currentFinancialYearStart;
                     
                     // Check if today is before or after the start of the financial year
                     if (staffPay.Pay_Date__c < Date.newInstance(inputYear , 7, 1)) {
                         currentFinancialYearStart = inputYear  - 1; // If input is before July 1st, the financial year started last year
                     } else {
                         currentFinancialYearStart = inputYear ; // If input is after June 30th, the financial year started this year
                     }
                     
                     Date financialStartDate = Date.newInstance(currentFinancialYearStart, 7, 1); 
                     Date financialEndDate = Date.newInstance(currentFinancialYearStart + 1, 6, 30); 
                     system.debug('financial year start date  '+financialStartDate + 'financial year end date '+financialEndDate);
                     Super_Annuation__mdt superAnnuation = [SELECT A_value__c,B_Value__c, Financial_Year__c FROM Super_Annuation__mdt 
                                                            where Start_Date__c=:financialStartDate and End_Date__c=:financialEndDate limit 1 ];
                    
                     staffPay.Super_Annuation1__c =  ((((staffPay.Gross_Salary__c - ( staffPay.Management_Fee1__c+staffPay.Pre_tax_values__c))*100)/superAnnuation.A_value__c)*superAnnuation.B_Value__c);
                     staffPay.Super_Annuation1__c =staffPay.Super_Annuation1__c >0 ?staffPay.Super_Annuation1__c :0;
                      system.debug('Super annuation '+staffPay.Super_Annuation1__c);
                     //staffPay.Super_Annuation1__c =  ((((staffPay.Gross_Salary__c - ( staffPay.Management_Fee1__c+staffPay.Pre_tax_values__c))*100)/111)*0.11);    // this line commented by praveen
                     //  Decimal grossSalaryFinal =staffPay.Gross_Salary__c- (staffPay.Management_Fee1__c + staffPay.Super_Annuation1__c + staffPay.Pre_Tax_Formula__c);
                     //  Above line is commented and new line is added by praveen for pretax calculation
                     decimal voluntarySuperValue=0; 
                     if(staffPay.Voluntary_Contribution__c != null){ 
                         if(staffPay.Voluntary_Contribution__c =='Fixed'){
                             voluntarySuperValue =staffPay.Voluntary_Contribution_Fixed__c;
                         }else{
                             voluntarySuperValue=  (staffPay.Gross_Salary__c*staffPay.Voluntary_Contribution_Percent__c)/100;
                         }
                         
                     }
                     system.debug('voluntarySuperValue '+voluntarySuperValue);
                     Decimal grossSalaryFinal=0;
                     if(staffPay.Type_of_User__c =='ICT User'){
                      	grossSalaryFinal =staffPay.Gross_Salary__c- (staffPay.Management_Fee1__c + staffPay.Super_Annuation1__c + staffPay.Pre_tax_values__c +voluntarySuperValue);   
                        // system.debug('gross salary final=> '+grossSalaryFinal );
                     }else{
                         system.debug('SuperAnnuation' +staffPay.Superannuation_Inc_or_exc__c);
                         if(staffPay.Superannuation_Inc_or_exc__c=='Include Superannuation'){
                             grossSalaryFinal =staffPay.Gross_Salary__c- (staffPay.Management_Fee1__c + staffPay.Super_Annuation1__c + staffPay.Pre_tax_values__c +voluntarySuperValue);
                            //  system.debug('gross salary final1=> '+grossSalaryFinal );
                         }else{
                             grossSalaryFinal =staffPay.Gross_Salary__c- (staffPay.Management_Fee1__c  + staffPay.Pre_tax_values__c +voluntarySuperValue);
                           //  system.debug('gross salary final2 =>'+grossSalaryFinal );
                         }
                     }
                     grossSalaryFinal =grossSalaryFinal >0 ? grossSalaryFinal :0;
                   system.debug('gross salary final2 =>'+grossSalaryFinal );
                    if(staffPay.Frequency__c=='Weekly'){
                        grossSalary = grossSalaryFinal.round(System.RoundingMode.DOWN);
                    }
                    else if(staffPay.Frequency__c=='Fortnightly'){
                        grossSalary = (grossSalaryFinal/2).round(System.RoundingMode.DOWN);
                    }
                    else{
                        grossSalary = ((grossSalaryFinal)*3/13).round(System.RoundingMode.DOWN);
                    }
                    grossSalary = grossSalary +0.99;
                    taxableGrossSalary = grossSalary;
                    staffPay.Taxable_Gross_Salary__c = taxableGrossSalary ;
                    Decimal residual =0;
                    
                    system.debug('taxable gross salary ==>'+taxableGrossSalary);
                   
                    List<Taxation__mdt> settings = [SELECT A_Value__c, B_Value__c, Max_value__c ,Min_Value__c,Type_of_scale__c,Year_Value__c FROM Taxation__mdt 
                                                        where Start_Date__c =: financialStartDate  and  End_Date__c =: financialEndDate and Type_of_scale__c=:scale];
                    system.debug(settings);
                    for(Taxation__mdt ss:settings){
                        if(taxableGrossSalary >=ss.Min_Value__c &&
                           taxableGrossSalary < ss.Max_value__c){
                            system.debug( 'A value '+ss.A_Value__c); 
                            system.debug( 'B value '+ss.B_Value__c); 
                              residual = ((taxableGrossSalary * ss.A_Value__c)-ss.B_Value__c);
                              staffPay.Tax_on_income__c = Math.Round(residual); 
                           }     
                    }
                   
                    // Scale 2 calculation tax
                    /*if(staffPay.Tax_free_threshold__c=='With Tax free threshold'){
                       // List<scaleApiValue__c> settings = [SELECT Name, Field1__c, Field2__c FROM scaleApiValue__c];
                        if(taxableGrossSalary < 359 ){
                            staffPay.Tax_on_income__c = 0;
                        }else if(taxableGrossSalary >= 359 && taxableGrossSalary < 438){
                            residual = ((taxableGrossSalary * 0.1900)-68.3462);
                            staffPay.Tax_on_income__c = Math.Round(residual); 
                        }else if(taxableGrossSalary >= 438 && taxableGrossSalary < 548){
                            residual = ((taxableGrossSalary * 0.2900)-112.1942);
                            staffPay.Tax_on_income__c = Math.Round(residual); 
                        }else if(taxableGrossSalary >= 548 && taxableGrossSalary < 721){
                            residual = ((taxableGrossSalary * 0.2100)-68.3465);
                            staffPay.Tax_on_income__c = Math.Round(residual); 
                        }else if(taxableGrossSalary >= 721 && taxableGrossSalary < 865){
                            residual = ((taxableGrossSalary * 0.2190)-74.8369);
                            staffPay.Tax_on_income__c = Math.Round(residual); 
                        }else if(taxableGrossSalary >= 865 && taxableGrossSalary < 1282){
                            residual = ((taxableGrossSalary * 0.3477)-186.2119);
                            staffPay.Tax_on_income__c = Math.Round(residual); 
                        }else if(taxableGrossSalary >= 1282 && taxableGrossSalary < 2307){
                            residual = ((taxableGrossSalary * 0.3450)-182.7504);
                            staffPay.Tax_on_income__c = Math.Round(residual); 
                        }else if(taxableGrossSalary >= 2307 && taxableGrossSalary < 3461){
                            residual = ((taxableGrossSalary * 0.3900)-286.5965);
                            staffPay.Tax_on_income__c = Math.Round(residual);  
                        }else {
                            residual = ((taxableGrossSalary * 0.4700)-563.5196);
                            staffPay.Tax_on_income__c = Math.Round(residual); 
                        }
                    }
                        // Scale 1 calculation tax
                       if(staffPay.Tax_free_threshold__c=='With out Tax free threshold'){
                            system.debug('in without');
                            if(taxableGrossSalary < 88 ){
                                residual = ((taxableGrossSalary * 0.1900)-0.1900);
                                staffPay.Tax_on_income__c = Math.Round(residual); 
                            }else if(taxableGrossSalary >= 88 && taxableGrossSalary < 371){
                                residual = ((taxableGrossSalary * 0.2348)-3.9639);
                                staffPay.Tax_on_income__c = Math.Round(residual); 
                            }else if(taxableGrossSalary >= 371 && taxableGrossSalary < 515){
                                residual = ((taxableGrossSalary * 0.2190)+1.9003);
                                staffPay.Tax_on_income__c = Math.Round(residual); 
                            }else if(taxableGrossSalary >= 515 && taxableGrossSalary < 932){
                                residual = ((taxableGrossSalary * 0.3477)-64.4297);
                                staffPay.Tax_on_income__c = Math.Round(residual); 
                            }else if(taxableGrossSalary >= 932 && taxableGrossSalary < 1957){
                                residual = ((taxableGrossSalary * 0.3450)-61.9132);
                                staffPay.Tax_on_income__c = Math.Round(residual); 
                            }else if(taxableGrossSalary >= 1957 && taxableGrossSalary < 3111){
                                residual = ((taxableGrossSalary * 0.3900)-150.0093);
                                staffPay.Tax_on_income__c = Math.Round(residual); 
                            }else {
                                residual = ((taxableGrossSalary * 0.4700)-398.9324);
                                staffPay.Tax_on_income__c = Math.Round(residual); 
                                
                            }
                        }
					*/
                    System.debug('tax on income '+staffPay.Tax_on_income__c);
                   
                }
                
                if(staffPay.Staff_ABN_Number__c!=null && staffPay.Staff_ABN_Number__c!=''){
                    System.debug('ABN Not null '+staffPay.Staff_ABN_Number__c);
                    staffPay.Gross_Salary__c = staffPay.Total_Hours__c*staffPay.Working_Hours_Rate__c;
                    staffPay.Super_Annuation1__c = 0;
                    staffPay.Tax_on_income__c = 0;
                    staffPay.Management_Fee1__c = 0;
                }
            }
        
         }
        
        
        
        if(trigger.isAfter && trigger.isUpdate){
            Set<Id> ids= New Set<Id>();
            list<Staff_Payroll_Setting__c> upddateYTD = new list<Staff_Payroll_Setting__c>();
            for(Staff_Payroll_Setting__c stf:trigger.new){
                Staff_Payroll_Setting__c oldStaff = trigger.oldMap.get(stf.Id);
                
                if(stf.Payroll_Setting__c!=oldStaff.Payroll_Setting__c){ids.add(stf.Payroll_Setting__c);
                                                                        ids.add(oldStaff.Payroll_Setting__c);
                                                                       }else{
                                                                           ids.add(stf.Payroll_Setting__c);
                                                                       }
                }
             
            StaffPayrollSettingTriggerHandler.updateNoOfStaff(trigger.new,ids);
        }
        
        if(trigger.isAfter && trigger.isInsert){
            Set<Id> ids= New Set<Id>();
            for (Staff_Payroll_Setting__c staff : Trigger.new) {
                ids.add(staff.Payroll_Setting__c);
            }
            StaffPayrollSettingTriggerHandler.updateNoOfStaff(trigger.new,ids);
        }
        
        
        
        if(trigger.isAfter){
            if(trigger.isInsert || trigger.isUpdate){
                List<RefreshDataTable__e> refreshDataTableEvents = new List<RefreshDataTable__e>();
                for (Staff_Payroll_Setting__c facility : Trigger.new) {
                    refreshDataTableEvents.add(new RefreshDataTable__e(
                        RecordId__c = facility.Id           
                    ));
                }
                EventBus.publish(refreshDataTableEvents);
            }
        }        
        
        if(trigger.isAfter && trigger.isDelete){
            Set<Id> ids= New Set<Id>();
            for(Staff_Payroll_Setting__c stf:trigger.old){
                ids.add(stf.Payroll_Setting__c);
            }
            system.debug('payrollSettingIds '+ids);
            StaffPayrollSettingTriggerHandler.updateNoOfStaff(trigger.old,ids);
        }
        
    }