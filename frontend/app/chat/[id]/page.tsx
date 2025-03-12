"use client"
import StartChat from "../../../src/components/Chat/StartChat";
import ChatComponent from "../../../src/components/screens/Chat/Chat";
import axios from "axios";
import { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
import Image from "next/image";

export interface Message {
    content: string;
    conversation_id: string;
    created_at: string;
    id: string;
    role: string;
}

export interface ConversationData {
    id: string;
    conversationId: string;
    userId: string;
    scenarioId: string;
    personaId: string;
    systemPromptId: string;
    feedbackPromptId: string;
    messages: Message[];
}

async function getConversationData(conversationId: string) {
    try {
        const response = await axios.get<ConversationData>(`/api/chat/${conversationId}`);
        return response.data;
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
                setConversationData({...data, id: id});
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
            <div className="flex justify-center items-center h-screen">
                <Image
                    width={200}
                    height={200}
                    alt="Union Training Bot"
                    src="/images/chat-bot.svg"
                    className="mb-6 md:mb-8 w-[150px] md:w-[250px]"
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



