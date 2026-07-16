export interface ICreateReviewPayload {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  rating: number;
  comment?: string;
}
