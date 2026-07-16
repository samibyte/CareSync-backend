export interface ICreatePrescriptionPayload {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  followUpDate: string | Date;
  instructions: string;
}
