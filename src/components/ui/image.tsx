
'use client';
import NextImage, { type ImageProps } from 'next/image';

const Image = ({ ...props }: ImageProps) => {
  return <NextImage {...props} />;
};

export default Image;
