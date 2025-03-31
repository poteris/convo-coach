"use client"
import StartChat from "../../../src/components/Chat/StartChat";
import ChatComponent from "../../../src/components/screens/Chat/Chat";
import axios from "axios";
import { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
import Image from "next/image";
import { z } from "zod";

export interface Message {
    content: string;
    conversation_id: string;
    created_at: string;
    id: string;
    role: string;
}

const MessageSchema = z.object({
    content: z.string(),
    conversation_id: z.string(),
    created_at: z.string(),
    id: z.string(),
    role: z.string()
});

const ConversationDataSchema = z.object({
    id: z.string(),
    conversationId: z.string(),
    userId: z.string(),
    scenarioId: z.string(),
    personaId: z.string(),
    systemPromptId: z.number(),
    feedbackPromptId: z.number(),
    messages: z.array(MessageSchema)
});

export type ConversationData = z.infer<typeof ConversationDataSchema>;

async function getConversationData(id: string): Promise<ConversationData> {
    try {
        const response = await axios.get(`/api/chat/${id}`);
        const conversationData = {...response.data, id: id};
        const parsedConversationData = ConversationDataSchema.parse(conversationData);
        return parsedConversationData;
    } catch (error) {
        console.error("Error fetching conversation data", error);
        throw new Error("Failed to load conversation data");
    }
}

export default function ChatPage() {
    const params = useParams();
    const [conversationData, setConversationData] = useState<ConversationData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchConversations = async () => {
            // Reset states when ID changes
            setLoading(true);
            setError(null);
            
            // Wait until params are available to avoid undefined error
            if (!params || typeof params.id !== 'string') {
                return; 
            }
            
            const id = params.id;
            
            try {
                const data = await getConversationData(id);
                setConversationData(data);
            } catch (error) {
                console.error("Failed to fetch conversation data:", error);
                setError("Unable to load conversation. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchConversations();
    }, [params]);

    // Show loading state
    if (loading) {
        return (
            <div className="absolute inset-0 flex justify-center items-center pointer-events-none -mt-16 md:mt-0">
                <Image
                    width={200}
                    height={200}
                    alt="Union Training Bot"
                    src="/images/chat-bot.svg"
                    className="w-[150px] md:w-[250px]"
                    priority
                />
            </div>
        );
    }

    // Show error state
    if (error) {
        return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
    }


    if (!conversationData) {
        return <div className="flex justify-center items-center h-screen">Preparing conversation...</div>;
    }

    // we go straight to the chat component if there are messages
    if (conversationData.messages && conversationData.messages.length > 0) {
        return <ChatComponent conversationData={conversationData} />;
    }

    return <StartChat chatData={conversationData} />;
}   



