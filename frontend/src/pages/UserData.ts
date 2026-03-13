// UserData – all via GraphQL (no internal API or Supabase details)
import { runGraphQL, getUserId } from '../lib/graphql';

export interface UserDetailsResponse {
  success: boolean;
  user_id?: string;
  is_active?: boolean;
  kundli_added?: boolean;
  message?: string;
}

export interface BiodataResponse {
  success: boolean;
  username: string;
  biodata: {
    date?: string;
    time?: string;
    yoga?: string;
    place?: string;
    [key: string]: unknown;
  };
}

export interface UserContentResponse {
  success: boolean;
  data?: unknown;
  message?: string;
}

const ME_DETAILS = `
  query MeDetails {
    meDetails {
      user_id
      is_active
      kundli_added
    }
  }
`;

const MY_BIODATA = `
  query MyBiodata {
    myBiodata {
      success
      username
      biodata
      error
    }
  }
`;

const MY_CONTENT = `
  query MyContent {
    myContent {
      success
      content
      error
    }
  }
`;

const ASK_QUERY = `
  query Ask($question: String!) {
    ask(question: $question) {
      success
      answer
      error
    }
  }
`;

export const fetchUserDetails = async (): Promise<UserDetailsResponse> => {
  const userId = getUserId();
  if (!userId) throw new Error('User ID not found');

  const { data, errors } = await runGraphQL<{ meDetails: { user_id: string; is_active: boolean; kundli_added: boolean } | null }>(ME_DETAILS);
  if (errors?.length) throw new Error(errors[0].message || 'Failed to fetch user details');

  const me = data?.meDetails;
  if (!me) return { success: false, message: 'Not authenticated' };
  return {
    success: true,
    user_id: me.user_id,
    is_active: me.is_active,
    kundli_added: me.kundli_added,
  };
};

export const fetchUserBiodata = async (): Promise<BiodataResponse> => {
  const details = await fetchUserDetails();
  if (!details.success || !details.kundli_added) {
    throw new Error('Kundli not available, biodata cannot be fetched');
  }

  const { data, errors } = await runGraphQL<{ myBiodata: { success: boolean; username: string; biodata: string; error: string | null } }>(MY_BIODATA);
  if (errors?.length) throw new Error(errors[0].message || 'Failed to fetch biodata');

  const result = data?.myBiodata;
  if (!result?.success || result.error) throw new Error(result?.error || 'Invalid response');
  const biodata = typeof result.biodata === 'string' ? JSON.parse(result.biodata) : result.biodata;
  return { success: true, username: result.username ?? '', biodata };
};

/**
 * Sends a chat message and returns the AI reply. Chat is always handled by the backend
 * (GraphQL ask → Groq via LangGraph/LangChain). The frontend never calls Groq or any LLM directly.
 */
export const sendChatMessage = async (question: string): Promise<string> => {
  const details = await fetchUserDetails();
  if (!details.success || !details.kundli_added) {
    throw new Error('Kundli not available, cannot start chat');
  }

  const { data, errors } = await runGraphQL<{ ask: { success: boolean; answer: string | null; error: string | null } }>(ASK_QUERY, { question });
  if (errors?.length) throw new Error('Request failed');

  const result = data?.ask;
  if (result?.success && result?.answer) return result.answer;
  throw new Error(result?.error || "I couldn't interpret the stars this time. Try again?");
};

export const fetchUserContent = async (): Promise<UserContentResponse> => {
  const details = await fetchUserDetails();
  if (!details.success || !details.kundli_added) {
    throw new Error('Kundli not available, content cannot be fetched');
  }

  const { data, errors } = await runGraphQL<{ myContent: { success: boolean; content: string | null; error: string | null } }>(MY_CONTENT);
  if (errors?.length) throw new Error(errors[0].message || 'Failed to fetch content');

  const result = data?.myContent;
  if (!result?.success || result.error) throw new Error(result?.error || 'Invalid response');
  const content = result.content ? JSON.parse(result.content) : null;
  return { success: true, data: content };
};
