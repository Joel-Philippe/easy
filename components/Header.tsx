import { Flex, Heading, Text, Menu, MenuButton, MenuList, MenuItem, Button } from "@chakra-ui/react";
import Link from 'next/link';
import { SmallAddIcon } from '@chakra-ui/icons'
import ProgressBar from './ProgressBar';

const Header = () => {
  return (
    <>
    <ProgressBar />
      <Flex p="2rem" direction="column" >
        <Heading as='h1' size='4xl' marginLeft="7%" noOfLines={1} className="tasklist-title">
          Time
        </Heading>
        <div style={{ zIndex: 1000 }}>
        </div>
      </Flex>
    </>
  )
}

export default Header;
