// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from "react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowAltCircleLeft,
  faArrowAltCircleRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
  index: number;
  totalItems: number;
  onNextClick: () => void;
  onPreviousClick: () => void;
}

function RequestIndex({
  index,
  onNextClick,
  onPreviousClick,
  totalItems,
}: Props): React.ReactElement<Props> {
  const previousClickActive = index !== 0;
  const nextClickActive = index < totalItems - 1;

  const prevClick = useCallback((): void => {
    previousClickActive && onPreviousClick();
  }, [onPreviousClick, previousClickActive]);

  const nextClick = useCallback((): void => {
    nextClickActive && onNextClick();
  }, [nextClickActive, onNextClick]);

  return (
    <div>
      <div className="flex justify-center">
        <FontAwesomeIcon
          className={`${
            previousClickActive ? "hover:cursor-pointer" : "opacity-50"
          }`}
          icon={faArrowAltCircleLeft as IconProp}
          onClick={prevClick}
        />
        <div className="mx-4">
          <span>{index + 1}</span>
          <span>/{totalItems}</span>
        </div>
        <FontAwesomeIcon
          className={`${
            nextClickActive ? "hover:cursor-pointer" : "opacity-50"
          }`}
          icon={faArrowAltCircleRight as IconProp}
          onClick={nextClick}
        />
      </div>
    </div>
  );
}

export default RequestIndex;
