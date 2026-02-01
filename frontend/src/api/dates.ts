/**
 * Date Proposals API
 * Handles date scheduling and proposals between matched users
 */

import api from '@/lib/api';
import type {
  CreateDateProposalRequest,
  CreateDateProposalResponse,
  RespondToDateRequest,
  RespondToDateResponse,
  DateProposalsResponse,
} from './types';

/**
 * Propose a date to another user
 * @param userId - The ID of the user to propose a date to
 * @param data - Date proposal details (date_time, location, activity)
 */
export async function proposeDate(userId: number, data: CreateDateProposalRequest) {
  return api.post<CreateDateProposalResponse>(`/dates/${userId}`, data);
}

/**
 * Respond to a date proposal (accept or decline)
 * @param proposalId - The ID of the date proposal
 * @param data - Response data (status: 'accepted' or 'declined')
 */
export async function respondToDate(proposalId: number, data: RespondToDateRequest) {
  return api.put<RespondToDateResponse>(`/dates/${proposalId}/respond`, data);
}

/**
 * Get all date proposals in a conversation with another user
 * @param userId - The ID of the other user in the conversation
 */
export async function getDateProposals(userId: number) {
  return api.get<DateProposalsResponse>(`/dates/conversation/${userId}`);
}
