import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import {
    Box,
    Button,
    Container,
    Heading,
    Text,
    VStack,
    HStack,
    Stack,
    Badge,
    List,
    ListItem,
    ListIcon,
    useColorModeValue,
    ButtonGroup,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';

const Pricing: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { subscriptionStatus, isLoading } = useSubscription();
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');

    const handleSubscribe = async () => {
        try {
            const response = await fetch(`/api/subscription/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    priceType: billingInterval,
                }),
            });

            const { url } = await response.json();
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
        }
    };

    const isSubscribed = subscriptionStatus?.status === 'active';
    const isSubscriptionCanceled = subscriptionStatus?.status === 'canceled';

    return (
        <Box py={12} px={4}>
            <Container maxW="7xl">
                <VStack spacing={4} textAlign="center">
                    <Heading as="h2" size="2xl">
                        Simple, transparent pricing
                    </Heading>
                    <Text fontSize="xl" color="gray.600">
                        Choose the plan that best fits your needs
                    </Text>
                    {!isLoading && isSubscribed && (
                        <VStack spacing={2}>
                            <Badge colorScheme="green" p={2} borderRadius="full">
                                Active Subscription
                            </Badge>
                            {subscriptionStatus?.currentPeriodEnd && (
                                <Text fontSize="sm" color="gray.500">
                                    Next billing date: {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
                                </Text>
                            )}
                        </VStack>
                    )}
                    {!isLoading && isSubscriptionCanceled && (
                        <VStack spacing={2}>
                            <Badge colorScheme="yellow" p={2} borderRadius="full">
                                Subscription Canceled
                            </Badge>
                            {subscriptionStatus?.currentPeriodEnd && (
                                <Text fontSize="sm" color="gray.500">
                                    Access until: {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
                                </Text>
                            )}
                        </VStack>
                    )}
                    <ButtonGroup size="sm" isAttached variant="outline" mt={6}>
                        <Button
                            onClick={() => setBillingInterval('monthly')}
                            colorScheme={billingInterval === 'monthly' ? 'blue' : 'gray'}
                        >
                            Monthly billing
                        </Button>
                        <Button
                            onClick={() => setBillingInterval('annual')}
                            colorScheme={billingInterval === 'annual' ? 'blue' : 'gray'}
                        >
                            Annual billing
                        </Button>
                    </ButtonGroup>
                </VStack>

                <Stack
                    direction={{ base: 'column', md: 'row' }}
                    spacing={{ base: 4, lg: 6 }}
                    mt={16}
                    maxW="4xl"
                    mx="auto"
                >
                    {/* Free Tier */}
                    <Box
                        flex={1}
                        p={6}
                        border="1px"
                        borderColor="gray.200"
                        borderRadius="lg"
                        bg={useColorModeValue('white', 'gray.800')}
                    >
                        <VStack spacing={4} align="stretch">
                            <Heading size="lg">Free</Heading>
                            <Text color="gray.500">Perfect for getting started with basic features</Text>
                            <HStack spacing={1}>
                                <Text fontSize="4xl" fontWeight="bold">$0</Text>
                                <Text color="gray.500">/month</Text>
                            </HStack>
                            <Button
                                colorScheme="gray"
                                size="lg"
                                onClick={() => navigate('/documents')}
                            >
                                Get Started
                            </Button>
                            <Box pt={4}>
                                <Text fontWeight="semibold" mb={4}>What's included:</Text>
                                <List spacing={3}>
                                    <ListItem>
                                        <ListIcon as={CheckIcon} color="green.500" />
                                        Basic document editing
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon as={CheckIcon} color="green.500" />
                                        Public documents only
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon as={CheckIcon} color="green.500" />
                                        Up to 5 documents
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon as={CheckIcon} color="green.500" />
                                        Documents expire after 24 hours
                                    </ListItem>
                                </List>
                            </Box>
                        </VStack>
                    </Box>

                    {/* Pro Tier */}
                    <Box
                        flex={1}
                        p={6}
                        border="1px"
                        borderColor="gray.200"
                        borderRadius="lg"
                        bg={useColorModeValue('white', 'gray.800')}
                    >
                        <VStack spacing={4} align="stretch">
                            <Heading size="lg">Pro</Heading>
                            <Text color="gray.500">For power users who need advanced features</Text>
                            <HStack spacing={1} align="baseline">
                                <Text fontSize="4xl" fontWeight="bold">
                                    ${billingInterval === 'monthly' ? '2' : '20'}
                                </Text>
                                <Text color="gray.500">/{billingInterval === 'monthly' ? 'month' : 'year'}</Text>
                                {billingInterval === 'annual' && (
                                    <Badge colorScheme="green" ml={2}>Save 17%</Badge>
                                )}
                            </HStack>
                            {!user ? (
                                <Button
                                    colorScheme="blue"
                                    size="lg"
                                    onClick={() => navigate('/login')}
                                >
                                    Login to Subscribe
                                </Button>
                            ) : isSubscribed ? (
                                <Button
                                    colorScheme="red"
                                    size="lg"
                                    onClick={() => window.location.href = 'https://billing.stripe.com/p/login/test'}
                                >
                                    Manage Subscription
                                </Button>
                            ) : (
                                <Button
                                    colorScheme="blue"
                                    size="lg"
                                    onClick={handleSubscribe}
                                >
                                    {isSubscriptionCanceled ? 'Resubscribe' : 'Subscribe'}
                                </Button>
                            )}
                            <Box pt={4}>
                                <Text fontWeight="semibold" mb={4}>What's included:</Text>
                                <List spacing={3}>
                                    <ListItem>
                                        <ListIcon as={CheckIcon} color="green.500" />
                                        Everything in Free
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon as={CheckIcon} color="green.500" />
                                        Private documents
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon as={CheckIcon} color="green.500" />
                                        Unlimited documents
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon as={CheckIcon} color="green.500" />
                                        Permanent document storage
                                    </ListItem>
                                    <ListItem>
                                        <ListIcon as={CheckIcon} color="green.500" />
                                        Priority support
                                    </ListItem>
                                </List>
                            </Box>
                        </VStack>
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
};

export default Pricing; 