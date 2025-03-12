import { useAtom } from "jotai";
import { scenarioAtom, selectedPersonaAtom } from "@/store";
import axios from "axios";
import { useEffect, useState } from "react";
import PersonaDetailsComponent from "./PersonaDetails";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { TrainingScenario } from "@/types/scenarios";
import { Persona } from "@/types/persona";
import ScenarioObjectives from "./ScenarioObjectives";
import ScenarioDescription from "./ScenarioDescription";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonBlock } from "./SkeletonBlock";
import ScenarioSetupLayout from "./Layout";

interface ScenarioSetupComponentProps {
    readonly scenarioId: string;
}


const ScenarioSetupSkeleton = () => {
    return (
        <>
            {/* Skeleton Header */}
            <div className="flex flex-row items-center gap-2 mt-4 md:mt-8 mx-4 md:ml-14 ">
                <ChevronLeft
                    className="w-4 h-4 text-gray-900  hover:cursor-pointer"
                />
                <Skeleton className="h-8 w-48" />
            </div>

            <div className="flex flex-col gap-3 md:gap-4 mx-4 md:m-14 min-h-screen relative pb-28 md:pb-24">
                {/* Description Card Skeleton */}
                <SkeletonBlock />

                {/* Objectives Card Skeleton */}
                <SkeletonBlock />

                {/* Persona Card Skeleton */}
                <SkeletonBlock />

                {/* Fixed Bottom Button Skeleton */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-card-alt border-t">
                    <div className="max-w-full md:max-w-[calc(100%-7rem)] mx-auto flex justify-end">
                        <Skeleton className="h-10 w-24" />
                    </div>
                </div>
            </div>
        </>
    );
};

async function getSelectedScenario(scenarioId: string) {
    try {
        const response = await axios.get<TrainingScenario>(`/api/scenarios/${scenarioId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching scenario:", error);
        return null;
    }
}

async function generatePersona() {
    try {
        const response = await axios.get<Persona>("/api/persona/generate-new-persona");
        return response.data;
    } catch (error) {
        console.error("Error generating persona:", error);
        return null;
    }
}


async function startChat( initialMessage: string, scenarioId: string, persona: Persona ) {
    const response = await axios.post<{ id: string }>("/api/chat/initialise-chat", {
        userId: uuidv4(),
        scenarioId,
        persona,
      });
      console.log("response", response.data.id);
      return response.data.id;
}

export default function ScenarioSetup({ scenarioId }: ScenarioSetupComponentProps) {
    const router = useRouter();
    const [, setScenario] = useAtom(scenarioAtom);
    const [persona, setPersona] = useAtom(selectedPersonaAtom);
    const [selectedScenario, setSelectedScenario] = useState<TrainingScenario | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRegeneratingPersona, setIsRegeneratingPersona] = useState(false);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const [scenarioData, personaData] = await Promise.all([
                    getSelectedScenario(scenarioId),
                    generatePersona()
                ]);

                if (scenarioData) {
                    setScenario(scenarioData);
                    setSelectedScenario(scenarioData);
                }

                if (personaData) {
                    setPersona(personaData);
                }
            } catch (error) {
                console.error("Error fetching initial data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [scenarioId, setScenario, setPersona]);

    const handleRegeneratePersona = async () => {
        setIsRegeneratingPersona(true);
        try {
            const newPersona = await generatePersona();
            if (newPersona) {
                setPersona(newPersona);
            }
        } catch (error) {
            console.error("Error regenerating persona:", error);
        } finally {
            setIsRegeneratingPersona(false);
        }
    };

    async function handleStartChat() {
        if (!selectedScenario || !persona) return;
        try {
            setIsStarting(true);
            const { id: conversationId } = await startChat(uuidv4(), scenarioId, persona);
            router.push(`/chat/${conversationId}`);
        } catch (error) {
            console.error('Error starting chat:', error);
            // You may want to show a toast/notification here
        } finally {
            setIsStarting(false);
        }
    }

    if (isLoading) {
        return (
            <ScenarioSetupLayout onStartChat={handleStartChat} isLoading={isLoading}>
                <ScenarioSetupSkeleton />
            </ScenarioSetupLayout>
        );
    }


    return (
        <ScenarioSetupLayout onStartChat={handleStartChat} isLoading={isLoading}>
            <div className="flex flex-col">
                {/* Scenario Header */}
                <div className="p-14 ">
                    <div className="flex flex-row items-center gap-2">
                        <ChevronLeft
                            data-testid="backButton"
                            className="w-4 h-4 text-gray-900 hover:cursor-pointer"
                            onClick={() => router.back()}
                        />
                        <h1 className="text-xl md:text-2xl font-regular text-gray-900 ">
                            {selectedScenario?.title}
                        </h1>
                    </div>

                    <div className="flex flex-col gap-3">
                        {selectedScenario && (
                            <>
                                <ScenarioDescription selectedScenario={selectedScenario} />
                                <ScenarioObjectives selectedScenario={selectedScenario} />
                                <PersonaDetailsComponent 
                                    persona={persona} 
                                    onRegeneratePersona={handleRegeneratePersona}
                                    isRegenerating={isRegeneratingPersona}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </ScenarioSetupLayout>
    );
}
