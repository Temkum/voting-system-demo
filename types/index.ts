export interface User {
  id: string;
  email: string;
  name: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  _id: string;
  title: string;
  options: PollOption[];
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  totalVotes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LiveUpdate {
  id: string;
  message: string;
  timestamp: string;
}
