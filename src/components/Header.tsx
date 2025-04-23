import { Box, Flex, Link, HStack } from "@chakra-ui/react";

const Header = () => {
  return (
    <Box px={4}>
      <Flex h={16}>
        <HStack>
          <Box>
            <Link>Home</Link>
          </Box>
          <Box>
            <Link>Activities</Link>
          </Box>
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header;
