global class SILInvoiceBatchScheduler implements Schedulable {

    global void execute(SchedulableContext sc) {

        // 🔥 Execute your batch
        SILInvoiceBatch batch = new SILInvoiceBatch();

        // Scope size (you can tune: 50–200 recommended)
        Database.executeBatch(batch, 10);
    }
}