export type AuthStackParamList = {
  Phone: undefined;
  OtpVerification: { phoneNumber: string };
};

export type MainStackParamList = {
  Home: undefined;
  CreateEvent: undefined;
  EventDetail: { eventId: string };
};
