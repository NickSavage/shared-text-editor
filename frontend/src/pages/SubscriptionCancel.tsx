import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { CloseIcon } from '@chakra-ui/icons';

const SubscriptionCancel: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/pricing');
        }, 5000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <Box minH="100vh" bg="gray.50" py={12}>
            <Container maxW="md">
                <Box bg="white" p={8} shadow="md" rounded="lg">
                    <VStack spacing={6}>
                        <Circle size="12" bg="red.100">
                            <Icon as={CloseIcon} w={4} h={4} color="red.500" />
                        </Circle>
                        <Heading size="lg" textAlign="center">
                            Subscription Cancelled
                        </Heading>
                        <Text color="gray.600" textAlign="center">
                            You will be redirected back to the pricing page in a few seconds.
                        </Text>
                        <Button
                            colorScheme="blue"
                            onClick={() => navigate('/pricing')}
                        >
                            Return to Pricing
                        </Button>
                    </VStack>
                </Box>
            </Container>
        </Box>
    );
};

export default SubscriptionCancel; 