package com.spc.spc_back.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.spc.spc_back.entity.spcdata.Characteristic;

@Mapper
public interface CharacteristicMapper {
    int insertCharacteristic(Characteristic characteristic);

    Characteristic selectCharacteristicByCharId(Long charId);

    List<Characteristic> selectCharacteristicListByProjId(Long projId);

    int updateCharacteristic(Characteristic characteristic);

    int deleteCharacteristic(Long charId);
}
