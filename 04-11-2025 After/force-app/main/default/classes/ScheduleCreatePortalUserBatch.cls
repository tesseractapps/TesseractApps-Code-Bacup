global class ScheduleCreatePortalUserBatch implements Schedulable {
    global void execute(SchedulableContext sc) {
        CreateUsersBatch CreateUser = new CreateUsersBatch();
        database.executebatch(CreateUser,100);
    }
}