import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSubscription } from '../context/SubscriptionContext';
import {
    Box,
    Container,
    VStack,
    Heading,
    Text,
    Button,
    Circle,
    Icon,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';

const SubscriptionSuccess: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const { refreshStatus } = useSubscription();

    useEffect(() => {
        // Refresh subscription status when the page loads
        refreshStatus();

        const timer = setTimeout(() => {
            navigate('/documents');
        }, 5000);

        return () => clearTimeout(timer);
    }, [navigate, refreshStatus]);

    return (
        <Box minH="100vh" bg="gray.50" py={12}>
            <Container maxW="md">
                <Box bg="white" p={8} shadow="md" rounded="lg">
                    <VStack spacing={6}>
                        <Circle size="12" bg="green.100">
                            <Icon as={CheckIcon} w={6} h={6} color="green.500" />
                        </Circle>
                        <Heading size="lg" textAlign="center">
                            Subscription Successful!
                        </Heading>
                        <Text color="gray.600" textAlign="center">
                            Thank you for subscribing. You will be redirected to your documents in a few seconds.
                        </Text>
                        <Button
                            colorScheme="blue"
                            onClick={() => navigate('/documents')}
                        >
                            Go to Documents
                        </Button>
                    </VStack>
                </Box>
            </Container>
        </Box>
    );
};

export default SubscriptionSuccess; 